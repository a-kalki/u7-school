import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import type { Answer, Questionnaire, QuestionnaireArMeta } from './entity';
import { QuestionnaireSchema } from './entity';
import type { Question, QuestionnairePool } from './question';
import { QuestionnairePoolSchema } from './question';
import { QuestionnaireEngine } from './questionnaire-engine';
import type { InviteResponse, QuestionnaireActionResponse } from './types';

/** Префикс значения кнопки «Далее» */
const NEXT_BUTTON_PREFIX = 'next:';

/** Агрегат анкеты. */
export class QuestionnaireAr extends Aggregate<QuestionnaireArMeta> {
  #engine: QuestionnaireEngine;

  constructor(state: Questionnaire) {
    super(state, QuestionnaireSchema);
    this.#engine = new QuestionnaireEngine(state.questionPool.questions);
  }

  // ═════════════════════════════════════════════════════════════
  // Фабрики
  // ═════════════════════════════════════════════════════════════

  /**
   * Создаёт анкету в статусе invited с переданным пулом.
   */
  static create(
    respondentId: string,
    pool: QuestionnairePool,
  ): QuestionnaireAr {
    // Валидируем пул
    v.parse(QuestionnairePoolSchema, pool);

    const state: Questionnaire = {
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'invited',
      currentQuestionCode: null,
      draftAnswers: {},
      answers: [],
      questionPool: pool,
      createdAt: isoNow(),
      completedAt: null,
    };
    return new QuestionnaireAr(state);
  }

  /**
   * Возвращает приглашение — InviteResponse.
   */
  getInvite(): InviteResponse {
    if (this.state.status !== 'invited') {
      this.throwBadRequest(
        'Анкета не в статусе invited, невозможно создать приглашение',
      );
    }
    const pool = this.state.questionPool;
    return {
      type: 'invited',
      questionnaireId: this.state.uuid,
      inviteText: pool.inviteText,
      whyText: pool.whyText,
    };
  }

  /**
   * Отказывается от приглашения: invited → abandoned.
   */
  decline(): void {
    if (this.state.status !== 'invited') {
      this.throwBadRequest(
        'Анкета не в статусе invited, невозможно отказаться',
      );
    }
    this.safeUpdate({ status: 'abandoned' });
  }

  /**
   * Запускает анкету: invited → in_progress, выдаёт первый вопрос.
   */
  start(): QuestionnaireActionResponse {
    if (this.state.status !== 'invited') {
      this.throwBadRequest(
        'Анкета не в статусе invited и не может быть запущена',
      );
    }

    this.safeUpdate({ status: 'in_progress' });

    return this.#findAndSetNextQuestion([]);
  }

  // ═════════════════════════════════════════════════════════════
  // Геттеры
  // ═════════════════════════════════════════════════════════════

  get currentQuestionCode(): string {
    if (!this.state.currentQuestionCode) {
      this.throwInternal('Недопустимое чтение кода текущего вопроса.');
    }
    return this.state.currentQuestionCode;
  }

  // ═════════════════════════════════════════════════════════════
  // Кнопка «Далее»
  // ═════════════════════════════════════════════════════════════

  static getNextButtonText(questionCode: string): string {
    return `${NEXT_BUTTON_PREFIX}${questionCode}`;
  }

  #isValidNextButtonText(value: string): boolean {
    return (
      value === QuestionnaireAr.getNextButtonText(this.currentQuestionCode)
    );
  }

  // ═════════════════════════════════════════════════════════════
  // Обработка действий
  // ═════════════════════════════════════════════════════════════

  handleAction(action: {
    type: 'callback' | 'text';
    value: string;
  }): QuestionnaireActionResponse {
    this.#checkIsInProgress();

    const questionCode = this.currentQuestionCode;
    const question = this.#getQuestion(questionCode);

    // ── Текстовый ввод ──
    if (action.type === 'text') {
      if (question.type === 'text') {
        return this.#submitCurrentQuestion(question, action.value);
      }
      this.throwBadRequest('Ожидался ответ с выбором (нажатием кнопки)');
    }

    // ── Колбэк ──

    // 1. Кнопка «Далее»
    if (action.value.startsWith(NEXT_BUTTON_PREFIX)) {
      if (!this.#isValidNextButtonText(action.value)) {
        this.throwBadRequest(
          'Кнопка «Далее» не соответствует текущему вопросу',
        );
      }
      if (question.type !== 'choice' || !question.multiple) {
        this.throwBadRequest(
          'Команда next доступна только для вопросов с множественным выбором',
        );
      }
      return this.#submitCurrentQuestion(question);
    }

    // 2. Выбор ответа (choice)
    if (question.type === 'choice') {
      const answerCode = action.value;
      if (!answerCode) {
        this.throwBadRequest('Код ответа не может быть пустым');
      }

      if (question.multiple) {
        return this.#toggleDraftAnswer(question, answerCode, questionCode);
      }

      return this.#submitCurrentQuestion(question, answerCode);
    }

    // 3. Колбэк при текстовом вопросе
    if (question.type === 'text') {
      this.throwBadRequest('Ожидался текстовый ответ');
    }

    this.throwInternal(
      `Неизвестный тип вопроса: ${(question as { type: string }).type}`,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // Черновики (multiple choice)
  // ═════════════════════════════════════════════════════════════

  #toggleDraftAnswer(
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

  // ═════════════════════════════════════════════════════════════
  // Сабмит вопроса
  // ═════════════════════════════════════════════════════════════

  #submitCurrentQuestion(
    question: Question,
    explicitValue?: string,
  ): QuestionnaireActionResponse {
    const questionCode = this.currentQuestionCode;
    const engine = this.#engine;

    // Извлекаем значение ответа
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

    // Валидация через engine
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

    // Формируем Answer (только коды, answerText только для text)
    const entry: Answer = {
      questionCode,
      answerCode: '',
      answeredAt: isoNow(),
    };

    if (question.type === 'text') {
      entry.answerCode = 'text';
      entry.answerText = typeof parsedValue === 'string' ? parsedValue : '';
    } else {
      const finalCodes: string[] = question.multiple
        ? (parsedValue as string[])
        : parsedValue !== undefined && parsedValue !== null
          ? [String(parsedValue)]
          : [];
      entry.answerCode = finalCodes.join(',');
    }

    this._state.answers.push(entry);

    // Очищаем черновики
    const newDraft = { ...this.state.draftAnswers };
    delete newDraft[questionCode];
    this.safeUpdate({ draftAnswers: newDraft });

    // Коды для условия ветвления
    const lastCodes: string[] =
      question.type === 'choice'
        ? entry.answerCode.split(',').filter(Boolean)
        : [];

    return this.#findAndSetNextQuestion(lastCodes);
  }

  // ═════════════════════════════════════════════════════════════
  // Переход к следующему вопросу
  // ═════════════════════════════════════════════════════════════

  #findAndSetNextQuestion(
    lastSelectedAnswers: string[],
  ): QuestionnaireActionResponse {
    const engine = this.#engine;

    const nextQuestion = engine.getNextQuestion(
      this.state.currentQuestionCode,
      this.state.answers,
    );

    const previousQuestion = this.state.currentQuestionCode
      ? this.#getQuestion(this.state.currentQuestionCode)
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

  // ═════════════════════════════════════════════════════════════
  // Текущее состояние для UI
  // ═════════════════════════════════════════════════════════════

  /**
   * Возвращает текущее состояние анкеты для UI.
   * Для invited — InviteResponse, для in_progress — вопрос, для completed/abandoned — completed.
   */
  getQuestionnaireActionResponse(): QuestionnaireActionResponse {
    if (this.state.status === 'invited') {
      return this.getInvite();
    }

    if (
      this.state.status === 'completed' ||
      this.state.status === 'abandoned'
    ) {
      return { type: 'completed' };
    }

    // in_progress
    const questionCode = this.state.currentQuestionCode;
    if (!questionCode) {
      this.throwInternal('Код текущего вопроса не установлен');
    }
    const question = this.#getQuestion(questionCode);

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

  // ═════════════════════════════════════════════════════════════
  // Завершение
  // ═════════════════════════════════════════════════════════════

  abandon(): void {
    if (
      this.state.status === 'in_progress' ||
      this.state.status === 'invited'
    ) {
      this.safeUpdate({ status: 'abandoned' });
      return;
    }
    if (this.state.status === 'abandoned') {
      return;
    }
    this.throwBadRequest('Анкета не активна');
  }

  // ═════════════════════════════════════════════════════════════
  // Защитные методы
  // ═════════════════════════════════════════════════════════════

  #checkIsInProgress(): void {
    if (this.state.status !== 'in_progress') {
      this.throwBadRequest('Анкета уже завершена');
    }
  }

  #getQuestion(questionCode: string): Question {
    const question = this.#engine.getByCode(questionCode);
    if (!question) {
      this.throwBadRequest(`Вопрос "${questionCode}" не найден в пуле`);
    }
    return question;
  }
}
