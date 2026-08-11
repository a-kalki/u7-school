import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import type { Answer, Questionnaire, QuestionnaireArMeta } from './entity';
import { QuestionnaireSchema } from './entity';
import type { Question } from './question';
import type { QuestionnaireEngine } from './questionnaire-engine';
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
  start(engine: QuestionnaireEngine): QuestionnaireActionResponse {
    if (this.state.status !== 'intention') {
      this.throwBadRequest(
        'Анкета не в статусе intention и не может быть запущена',
      );
    }

    const poolSnapshot = engine.getAll();
    this.safeUpdate({
      status: 'in_progress',
      questionPool: poolSnapshot as unknown as Record<string, unknown>[],
    });

    return this.findAndSetNextQuestion([], engine);
  }

  /**
   * Создаёт и сразу запускает анкету (в in_progress).
   */
  static startNew(
    respondentId: number,
    engine: QuestionnaireEngine,
  ): QuestionnaireAr {
    const state: Questionnaire = {
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'in_progress',
      answers: [],
      currentQuestionCode: null,
      draftAnswers: {},
      questionPool: engine.getAll() as unknown as Record<string, unknown>[],
      createdAt: isoNow(),
      completedAt: null,
    };
    const ar = new QuestionnaireAr(state);
    ar.findAndSetNextQuestion([], engine);
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

  handleAction(
    action: {
      type: 'callback' | 'text';
      value: string;
    },
    engine: QuestionnaireEngine,
  ): QuestionnaireActionResponse {
    this.checkIsInProgress();

    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode, engine);

    // ── Ветка: текстовый ввод ──
    if (action.type === 'text') {
      if (question.type === 'text') {
        return this.submitCurrentQuestion(question, engine, action.value);
      }
      this.throwBadRequest('Ожидался ответ с выбором (нажатием кнопки)');
    }

    // ── Ветка: колбэк (нажатие кнопки) ──

    // 1. Кнопка «Далее» (сабмит черновиков)
    if (action.value.startsWith(NEXT_BUTTON_PREFIX)) {
      if (!this.isValidNextButtonText(action.value)) {
        this.throwBadRequest(
          'Кнопка «Далее» не соответствует текущему вопросу',
        );
      }
      if (question.type !== 'choice' || !question.multiple) {
        this.throwBadRequest(
          'Команда next доступна только для вопросов с множественным выбором',
        );
      }
      return this.submitCurrentQuestion(question, engine);
    }

    // 2. Выбор ответа (choice)
    if (question.type === 'choice') {
      const answerCode = action.value;

      if (!answerCode) {
        this.throwBadRequest('Код ответа не может быть пустым');
      }

      if (question.multiple) {
        return this.toggleDraftAnswer(question, answerCode, questionCode);
      }

      // Одиночный выбор — сабмитим сразу
      return this.submitCurrentQuestion(question, engine, answerCode);
    }

    // 3. Колбэк пришёл, но текущий вопрос — текстовый
    if (question.type === 'text') {
      this.throwBadRequest('Ожидался текстовый ответ');
    }

    this.throwInternal(
      `Неизвестный тип вопроса: ${(question as { type: string }).type}`,
    );
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
    engine: QuestionnaireEngine,
    explicitValue?: string,
  ): QuestionnaireActionResponse {
    const questionCode = this.currentQuestionCode;

    // Получаем значение ответа
    let rawValue: string | string[] | undefined = explicitValue;
    if (rawValue === undefined) {
      const draft = this.state.draftAnswers[questionCode];
      if (question.type === 'choice' && !question.multiple) {
        rawValue = draft ? draft.split(',').filter(Boolean)[0] : undefined;
      } else if (question.type === 'choice' && question.multiple) {
        rawValue = draft ? draft.split(',').filter(Boolean) : [];
      } else {
        rawValue = draft || undefined;
      }
    }

    // Валидация
    const schema = engine.buildValidationSchema(questionCode);
    let parsedValue: unknown;
    try {
      parsedValue = v.parse(schema, rawValue);
    } catch (e) {
      if (e instanceof v.ValiError) {
        this.throwInternal(
          `Некорректный ответ на вопрос "${question.question}"`,
        );
      }
      throw e;
    }

    // Формируем Answer с полным контекстом
    const entry: Answer = {
      questionCode,
      questionText: question.question,
      answerCode: '',
      answerText: '',
      choices:
        question.type === 'choice'
          ? question.answers.map((a) => ({
              code: a.answerCode,
              text: a.answer,
            }))
          : [],
      answeredAt: isoNow(),
    };

    if (question.type === 'text') {
      entry.answerCode = 'text';
      entry.answerText = typeof parsedValue === 'string' ? parsedValue : '';
    } else {
      const finalAnswerCodes: string[] = question.multiple
        ? (parsedValue as string[])
        : parsedValue !== undefined && parsedValue !== null
          ? [String(parsedValue)]
          : [];

      entry.answerCode = finalAnswerCodes.join(',');
      const selectedOption = question.answers.find(
        (a) => a.answerCode === finalAnswerCodes[0],
      );
      entry.answerText = selectedOption?.answer ?? '';
    }

    this._state.answers.push(entry);

    // Очищаем черновики для текущего вопроса
    const newDraft = { ...this.state.draftAnswers };
    delete newDraft[questionCode];
    this.safeUpdate({ draftAnswers: newDraft });

    const finalAnswerCodes: string[] =
      question.type === 'choice'
        ? question.multiple
          ? (parsedValue as string[])
          : parsedValue !== undefined && parsedValue !== null
            ? [String(parsedValue)]
            : []
        : [];

    return this.findAndSetNextQuestion(finalAnswerCodes, engine);
  }

  // ── Переход к следующему вопросу ──

  protected findAndSetNextQuestion(
    lastSelectedAnswers: string[],
    engine: QuestionnaireEngine,
  ): QuestionnaireActionResponse {
    const nextQuestion = engine.getNextQuestion(
      this.state.currentQuestionCode,
      this.state.answers,
    );

    const previousQuestion = this.state.currentQuestionCode
      ? this.getQuestion(this.state.currentQuestionCode, engine)
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
    engine: QuestionnaireEngine,
  ): QuestionnaireActionResponse {
    if (this.state.status === 'completed') {
      return { type: 'completed' };
    }

    if (this.state.status === 'intention') {
      this.throwBadRequest('Анкета ещё не запущена');
    }

    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode, engine);

    if (question.type === 'choice' && question.multiple) {
      const draft = this.state.draftAnswers[questionCode] ?? '';
      const selectedAnswers = draft ? draft.split(',').filter(Boolean) : [];
      if (selectedAnswers.length > 0) {
        return {
          type: 'wait_next',
          currentQuestion: question,
          selectedAnswers,
          nextButton: QuestionnaireAr.getNextButtonText(questionCode),
        };
      }
    }

    const draft = this.state.draftAnswers[questionCode] ?? '';
    const selectedAnswers = draft ? draft.split(',').filter(Boolean) : [];

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
    engine: QuestionnaireEngine,
  ): Question {
    const question = engine.getByCode(questionCode);
    if (!question) {
      this.throwBadRequest(`Вопрос "${questionCode}" не найден в пуле`);
    }
    return question;
  }
}
