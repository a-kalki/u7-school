import { Aggregate } from '@u7/core/domain';
import { isoNow } from '@u7/core/shared';
import * as v from 'valibot';
import type { AnswerEntry, Questionnaire, QuestionnaireArMeta } from './entity';
import { QuestionnaireSchema } from './entity';
import type { Question } from './question';
import type { QuestionPoolService } from './question-pool-service';
import type { QuestionnaireActionResponse } from './types';

/** Префикс значения кнопки «Далее» */
const NEXT_BUTTON_PREFIX = 'next:';

/** Агрегат прохождения анкеты */
export class QuestionnaireAr extends Aggregate<QuestionnaireArMeta> {
  readonly #poolService: QuestionPoolService;

  constructor(state: Questionnaire, poolService: QuestionPoolService) {
    super(state, QuestionnaireSchema);
    this.#poolService = poolService;
  }

  get currentQuestionCode(): string {
    if (!this.state.currentQuestionCode) {
      this.throwInternal('Недопустимое чтение кода текущего вопроса.');
    }
    return this.state.currentQuestionCode;
  }

  /**
   * Фабричный метод — создаёт новую анкету и определяет первый вопрос.
   */
  static start(
    telegramId: number,
    poolService: QuestionPoolService,
  ): QuestionnaireAr {
    const state: Questionnaire = {
      uuid: crypto.randomUUID(),
      telegramId,
      status: 'in_progress',
      answers: [],
      currentQuestionCode: null,
      draftAnswers: [],
      createdAt: isoNow(),
    };
    const ar = new QuestionnaireAr(state, poolService);
    ar.findAndSetNextQuestion([]);
    return ar;
  }

  // ── Публичные хелперы для nextButton ──

  /** Форматирует текст кнопки «Далее» для переданного кода вопроса */
  static getNextButtonText(questionCode: string): string {
    return `${NEXT_BUTTON_PREFIX}${questionCode}`;
  }

  /** Проверяет, что значение — валидная кнопка «Далее» для текущего вопроса */
  isValidNextButtonText(value: string): boolean {
    return (
      value === QuestionnaireAr.getNextButtonText(this.currentQuestionCode)
    );
  }

  isCompleted(): boolean {
    return this.state.status === 'completed';
  }

  // ── Основной метод ──

  /**
   * Универсальный метод обработки действий пользователя.
   * Агрегат сам знает текущий вопрос и проверяет корректность ответа.
   *
   * Гарантирует целостность состояния при любых входных данных:
   * - колбэки с предыдущих вопросов отклоняются
   * - текстовый ввод на выборный вопрос отклоняется
   * - кнопка «Далее» проверяется на соответствие текущему вопросу
   */
  handleAction(action: {
    type: 'callback' | 'text';
    value: string;
  }): QuestionnaireActionResponse {
    this.checkIsInProgress();

    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode);

    // ── Ветка: текстовый ввод ──
    if (action.type === 'text') {
      if (question.type === 'text') {
        return this.submitCurrentQuestion(action.value);
      }
      this.throwBadRequest('Ожидался ответ с выбором (нажатием кнопки)');
    }

    // ── Ветка: колбэк (нажатие кнопки) ──
    // action.type === 'callback'

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
      return this.submitCurrentQuestion();
    }

    // 2. Выбор ответа
    if (question.type === 'choice') {
      const answerCode = action.value;

      if (!answerCode) {
        this.throwBadRequest('Код ответа не может быть пустым');
      }

      if (question.multiple) {
        return this.toggleDraftAnswer(question, answerCode, questionCode);
      }

      // Одиночный выбор — сабмитим сразу
      return this.submitCurrentQuestion(answerCode);
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
    const draft = this.state.draftAnswers ?? [];
    const idx = draft.indexOf(answerCode);
    const newDraft: string[] =
      idx >= 0 ? draft.filter((c) => c !== answerCode) : [...draft, answerCode];

    this.safeUpdate({ draftAnswers: newDraft });

    const response: QuestionnaireActionResponse = {
      type: 'wait_next',
      currentQuestion: question,
      selectedAnswers: newDraft,
    };
    if (newDraft.length > 0) {
      response.nextButton = QuestionnaireAr.getNextButtonText(questionCode);
    }
    return response;
  }

  // ── Сабмит текущего вопроса ──

  /** Принимает и валидирует ответ, переходит к следующему вопросу */
  protected submitCurrentQuestion(value?: string): QuestionnaireActionResponse {
    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode);

    // Если значение не передано явно, берём из черновика
    let actualValue: string | string[] | undefined = value;
    if (actualValue === undefined) {
      const draft = this.state.draftAnswers ?? [];
      if (question.type === 'choice' && !question.multiple) {
        actualValue = draft[0];
      } else {
        actualValue = draft;
      }
    }

    // Валидация
    const schema = this.#poolService.buildValidationSchema(questionCode);
    let parsedValue: unknown;
    try {
      parsedValue = v.parse(schema, actualValue);
    } catch (e) {
      if (e instanceof v.ValiError) {
        const qText = this.getQuestionText(questionCode);
        this.throwInternal(`Некорректный ответ на вопрос "${qText}"`);
      }
      throw e;
    }

    const entry: AnswerEntry = {
      questionCode,
      answerCodes: [],
      answeredAt: isoNow(),
    };

    if (question.type === 'choice') {
      entry.answerCodes = Array.isArray(parsedValue)
        ? (parsedValue as string[])
        : parsedValue !== undefined && parsedValue !== null
          ? [String(parsedValue)]
          : [];
    } else if (question.type === 'text') {
      entry.textValue =
        typeof parsedValue === 'string' ? parsedValue : undefined;
    }

    this._state.answers.push(entry);
    const lastSelected = entry.answerCodes;
    this.safeUpdate({ draftAnswers: [] });

    return this.findAndSetNextQuestion(lastSelected);
  }

  // ── Переход к следующему вопросу ──

  /** Определяет следующий вопрос с учётом ветвления и обновляет стейт */
  protected findAndSetNextQuestion(
    lastSelectedAnswers: string[],
  ): QuestionnaireActionResponse {
    const nextQuestion = this.#poolService.getNextQuestion(
      this.state.currentQuestionCode,
      this.state.answers,
    );

    const previousQuestion = this.state.currentQuestionCode
      ? this.getQuestion(this.state.currentQuestionCode)
      : undefined; // при старте анкеты вопроса ещё нет

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

    this.safeUpdate({ status: 'completed', currentQuestionCode: null });
    return {
      type: 'completed',
      selectedAnswers: lastSelectedAnswers,
      previousQuestion,
      previousSelectedAnswers: lastSelectedAnswers,
    };
  }

  // ── Состояние для UI ──

  /** Возвращает текущее состояние в виде ответа для UI */
  getQuestionnaireActionResponse(): QuestionnaireActionResponse {
    if (this.state.status === 'completed') {
      return { type: 'completed' };
    }

    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode);

    if (
      question.type === 'choice' &&
      question.multiple &&
      (this.state.draftAnswers?.length ?? 0) > 0
    ) {
      return {
        type: 'wait_next',
        currentQuestion: question,
        selectedAnswers: this.state.draftAnswers ?? [],
        nextButton: QuestionnaireAr.getNextButtonText(questionCode),
      };
    }

    return {
      type: 'new_question',
      question,
      selectedAnswers: this.state.draftAnswers ?? [],
    };
  }

  // ── Завершение анкеты ──

  /** Прерывает анкету */
  abandon(): void {
    if (this.state.status !== 'in_progress') return;
    this.safeUpdate({ status: 'abandoned' });
  }

  /** Текущее состояние для сериализации */
  getCurrentState(): Questionnaire {
    return this.state;
  }

  /** Все ответы */
  getAnswers(): AnswerEntry[] {
    return this.state.answers;
  }

  // ── Защитные методы ──

  protected checkIsInProgress(): void {
    if (this.state.status !== 'in_progress') {
      this.throwBadRequest('Анкета уже завершена');
    }
  }

  protected getQuestion(questionCode: string): Question {
    const question = this.#poolService.getByCode(questionCode);
    if (!question) {
      this.throwBadRequest(
        `Вопрос "${this.getQuestionText(questionCode)}" не найден в пуле`,
      );
    }
    return question;
  }

  /** Возвращает текст вопроса по коду или сам код, если вопрос не найден */
  protected getQuestionText(code: string): string {
    const q = this.#poolService.getByCode(code);
    return q ? q.question : code;
  }
}
