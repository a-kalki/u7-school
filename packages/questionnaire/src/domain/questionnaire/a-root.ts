import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import type { Answer, Questionnaire, QuestionnaireArMeta } from './entity';
import { QuestionnaireSchema } from './entity';
import type { Question } from './question';
import type { QuestionPoolService } from './question-pool-service';
import type { QuestionnaireActionResponse } from './types';

/** Префикс значения кнопки «Далее» */
const NEXT_BUTTON_PREFIX = 'next:';

/** Агрегат анкеты */
export class QuestionnaireAr extends Aggregate<QuestionnaireArMeta> {
  constructor(state: Questionnaire) {
    super(state, QuestionnaireSchema);
  }

  // ── Статические фабрики ──

  /**
   * Создаёт анкету в статусе intention (без пула вопросов).
   * Используется когда анкета создаётся заранее, а запускается позже.
   */
  static createIntention(respondentId: number): QuestionnaireAr {
    const state: Questionnaire = {
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'intention',
      currentQuestionCode: null,
      draftAnswers: {},
      answers: [],
      questionPool: null,
      createdAt: isoNow(),
      completedAt: null,
    };
    return new QuestionnaireAr(state);
  }

  /**
   * Запускает анкету: переводит из intention в in_progress,
   * сохраняет снимок пула вопросов и выдаёт первый вопрос.
   */
  start(poolService: QuestionPoolService): QuestionnaireActionResponse {
    if (this.state.status !== 'intention') {
      this.throwBadRequest(
        'Анкета не в статусе intention и не может быть запущена',
      );
    }

    const poolSnapshot = poolService.getAll();
    this.safeUpdate({
      status: 'in_progress',
      questionPool: poolSnapshot as unknown as Record<string, unknown>[],
    });

    return this.findAndSetNextQuestion([], poolService);
  }

  /**
   * Запускает анкету из произвольного состояния (для обратной совместимости).
   */
  static startNew(
    respondentId: number,
    poolService: QuestionPoolService,
  ): QuestionnaireAr {
    const state: Questionnaire = {
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'in_progress',
      answers: [],
      currentQuestionCode: null,
      draftAnswers: {},
      questionPool: poolService.getAll() as unknown as Record<
        string,
        unknown
      >[],
      createdAt: isoNow(),
      completedAt: null,
    };
    const ar = new QuestionnaireAr(state);
    ar.findAndSetNextQuestion([], poolService);
    return ar;
  }

  // ── Геттеры ──

  get currentQuestionCode(): string {
    if (!this.state.currentQuestionCode) {
      this.throwInternal('Недопустимое чтение кода текущего вопроса.');
    }
    return this.state.currentQuestionCode;
  }

  isCompleted(): boolean {
    return this.state.status === 'completed';
  }

  // ── Публичные хелперы для nextButton ──

  static getNextButtonText(questionCode: string): string {
    return `${NEXT_BUTTON_PREFIX}${questionCode}`;
  }

  isValidNextButtonText(value: string): boolean {
    return (
      value === QuestionnaireAr.getNextButtonText(this.currentQuestionCode)
    );
  }

  // ── Основной метод обработки действий ──

  /**
   * Универсальный метод обработки действий пользователя.
   * Принимает poolService параметром (не хранится в агрегате).
   */
  handleAction(
    action: {
      type: 'callback' | 'text';
      value: string;
    },
    poolService: QuestionPoolService,
  ): QuestionnaireActionResponse {
    this.checkIsInProgress();

    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode, poolService);

    // ── Текстовый ввод (не используется в choice-анкетах) ──
    if (action.type === 'text') {
      this.throwBadRequest('Ожидался ответ с выбором (нажатием кнопки)');
    }

    // ── Колбэк (нажатие кнопки) ──

    // 1. Кнопка «Далее» (сабмит черновиков)
    if (action.value.startsWith(NEXT_BUTTON_PREFIX)) {
      if (!this.isValidNextButtonText(action.value)) {
        this.throwBadRequest(
          'Кнопка «Далее» не соответствует текущему вопросу',
        );
      }
      if (!question.multiple) {
        this.throwBadRequest(
          'Команда next доступна только для вопросов с множественным выбором',
        );
      }
      return this.submitCurrentQuestion(question, poolService);
    }

    // 2. Выбор ответа
    const answerCode = action.value;

    if (!answerCode) {
      this.throwBadRequest('Код ответа не может быть пустым');
    }

    if (question.multiple) {
      return this.toggleDraftAnswer(question, answerCode, questionCode);
    }

    // Одиночный выбор — сабмитим сразу
    return this.submitCurrentQuestion(question, poolService, answerCode);

    // Игнорируем случай не-choice вопросов — их больше нет
  }

  // ── Переключение черновиков (multiple choice) ──

  private toggleDraftAnswer(
    question: Question,
    answerCode: string,
    questionCode: string,
  ): QuestionnaireActionResponse {
    const currentDraft = this.state.draftAnswers[questionCode];
    const currentAnswers = currentDraft
      ? currentDraft.split(',').filter(Boolean)
      : [];

    const idx = currentAnswers.indexOf(answerCode);
    const newAnswers: string[] =
      idx >= 0
        ? currentAnswers.filter((c) => c !== answerCode)
        : [...currentAnswers, answerCode];

    const newDraft = { ...this.state.draftAnswers };
    if (newAnswers.length > 0) {
      newDraft[questionCode] = newAnswers.join(',');
    } else {
      delete newDraft[questionCode];
    }

    this.safeUpdate({ draftAnswers: newDraft });

    const response: QuestionnaireActionResponse = {
      type: 'wait_next',
      currentQuestion: question,
      selectedAnswers: newAnswers,
    };
    if (newAnswers.length > 0) {
      response.nextButton = QuestionnaireAr.getNextButtonText(questionCode);
    }
    return response;
  }

  // ── Сабмит текущего вопроса ──

  protected submitCurrentQuestion(
    question: Question,
    poolService: QuestionPoolService,
    explicitValue?: string,
  ): QuestionnaireActionResponse {
    const questionCode = this.currentQuestionCode;

    // Получаем значение ответа
    let answerCodes: string[];
    if (explicitValue !== undefined) {
      answerCodes = [explicitValue];
    } else {
      const draft = this.state.draftAnswers[questionCode];
      answerCodes = draft ? draft.split(',').filter(Boolean) : [];
    }

    // Валидация
    const schema = poolService.buildValidationSchema(questionCode);
    let parsedValue: unknown;
    try {
      // Для multiple — массив, для single — строка
      parsedValue = question.multiple
        ? v.parse(schema, answerCodes)
        : v.parse(schema, answerCodes[0]);
    } catch (e) {
      if (e instanceof v.ValiError) {
        this.throwInternal(
          `Некорректный ответ на вопрос "${question.question}"`,
        );
      }
      throw e;
    }

    // Формируем Answer с полным контекстом
    const finalAnswerCodes: string[] = question.multiple
      ? (parsedValue as string[])
      : parsedValue !== undefined && parsedValue !== null
        ? [String(parsedValue)]
        : [];

    const selectedOption = question.answers.find(
      (a) => a.answerCode === finalAnswerCodes[0],
    );

    const entry: Answer = {
      questionCode,
      questionText: question.question,
      answerCode: finalAnswerCodes.join(','),
      answerText: selectedOption?.answer ?? '',
      choices: question.answers.map((a) => ({
        code: a.answerCode,
        text: a.answer,
      })),
      answeredAt: isoNow(),
    };

    this._state.answers.push(entry);

    // Очищаем черновики для текущего вопроса
    const newDraft = { ...this.state.draftAnswers };
    delete newDraft[questionCode];
    this.safeUpdate({ draftAnswers: newDraft });

    return this.findAndSetNextQuestion(finalAnswerCodes, poolService);
  }

  // ── Переход к следующему вопросу ──

  protected findAndSetNextQuestion(
    lastSelectedAnswers: string[],
    poolService: QuestionPoolService,
  ): QuestionnaireActionResponse {
    const nextQuestion = poolService.getNextQuestion(
      this.state.currentQuestionCode,
      this.state.answers,
    );

    const previousQuestion = this.state.currentQuestionCode
      ? this.getQuestion(this.state.currentQuestionCode, poolService)
      : undefined;

    if (nextQuestion) {
      this.safeUpdate({ currentQuestionCode: nextQuestion.questionCode });
      return {
        type: 'new_question',
        question: nextQuestion,
        selectedAnswers: [],
        previousQuestion,
        previousSelectedAnswers: lastSelectedAnswers,
      };
    }

    this.safeUpdate({
      status: 'completed',
      currentQuestionCode: null,
      completedAt: isoNow(),
    });
    return {
      type: 'completed',
      selectedAnswers: lastSelectedAnswers,
      previousQuestion,
      previousSelectedAnswers: lastSelectedAnswers,
    };
  }

  // ── Состояние для UI ──

  getQuestionnaireActionResponse(
    poolService: QuestionPoolService,
  ): QuestionnaireActionResponse {
    if (this.state.status === 'completed') {
      return { type: 'completed' };
    }

    if (this.state.status === 'intention') {
      this.throwBadRequest('Анкета ещё не запущена');
    }

    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode, poolService);
    const draft = this.state.draftAnswers[questionCode] ?? '';
    const selectedAnswers = draft ? draft.split(',').filter(Boolean) : [];

    if (question.multiple && selectedAnswers.length > 0) {
      return {
        type: 'wait_next',
        currentQuestion: question,
        selectedAnswers,
        nextButton: QuestionnaireAr.getNextButtonText(questionCode),
      };
    }

    return {
      type: 'new_question',
      question,
      selectedAnswers,
    };
  }

  // ── Завершение анкеты ──

  abandon(): void {
    if (this.state.status !== 'in_progress') return;
    this.safeUpdate({ status: 'abandoned' });
  }

  getCurrentState(): Questionnaire {
    return this.state;
  }

  getAnswers(): Answer[] {
    return this.state.answers;
  }

  getRespondentId(): number {
    return this.state.respondentId;
  }

  // ── Защитные методы ──

  protected checkIsInProgress(): void {
    if (this.state.status !== 'in_progress') {
      this.throwBadRequest('Анкета уже завершена');
    }
  }

  protected getQuestion(
    questionCode: string,
    poolService: QuestionPoolService,
  ): Question {
    const question = poolService.getByCode(questionCode);
    if (!question) {
      this.throwBadRequest(`Вопрос "${questionCode}" не найден в пуле`);
    }
    return question;
  }
}
