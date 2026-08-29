import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import type {
  AbandonReason,
  Answer,
  BaseQuestionnaireArMeta,
  BaseQuestionnaireState,
} from './entity';
import { AbandonReasonSchema } from './entity';
import type { Question } from './question';
import { QuestionnaireEngine } from './questionnaire-engine';
import type { InviteResponse, QuestionnaireActionResponse } from './types';

/** Префикс значения кнопки «Далее» */
const NEXT_BUTTON_PREFIX = 'next:';

/**
 * Абстрактная основа анкеты: вся логика.
 * Конкретные агрегаты подставляют свой метатип (state + events).
 */
export abstract class BaseQuestionnaireAr<
  TMeta extends BaseQuestionnaireArMeta = BaseQuestionnaireArMeta,
> extends Aggregate<TMeta> {
  #engine: QuestionnaireEngine;

  constructor(state: TMeta['state'], schema: v.GenericSchema<TMeta['state']>) {
    super(state, schema);
    this.#engine = this.buildEngine(state);
  }

  /** Строит движок из вопросов пула. Переопределяется в наследниках. */
  protected buildEngine(state: TMeta['state']): QuestionnaireEngine {
    return new QuestionnaireEngine(state.questionPool.questions as Question[]);
  }

  /**
   * Событие завершения анкеты. Каждый конкретный агрегат строит своё событие —
   * тип события привязан к метатипу и проверяется компилятором.
   */
  protected abstract buildCompletedEvent(): TMeta['events'];

  /** Событие отказа от приглашения (invited → abandoned). */
  protected abstract buildDeclinedEvent(): TMeta['events'];

  /** Событие прерывания анкеты (in_progress → abandoned). */
  protected abstract buildAbandonedEvent(
    reason: AbandonReason,
  ): TMeta['events'];

  /**
   * Инвариант агрегата: анкета в статусе abandoned всегда имеет заполненную
   * причину прерывания (abandonReason). Проверяется при конструировании/restore
   * и при каждом обновлении состояния (см. core Aggregate).
   */
  protected override checkInvariant(): void {
    if (this._state.status === 'abandoned' && !this._state.abandonReason) {
      this.throwInvariant(
        { uuid: this._state.uuid, status: this._state.status },
        'Анкета в статусе abandoned без причины прерывания (abandonReason)',
      );
    }
  }

  /**
   * Отмечает, что анкете отправлено предупреждение о закрытии.
   * Вызывается планировщиком брошенных анкет (SweepAbandonedJob).
   *
   * ВАЖНО: обходит safeUpdate — предупреждение не должно сдвигать updatedAt,
   * иначе таймер простоя сбросится и анкета никогда не будет закрыта.
   */
  markWarned(): void {
    this.#checkIsInProgress();
    this._state = this.validateState({
      ...this._state,
      warnedAt: isoNow(),
    });
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
      cancelWarning: pool.cancelWarning,
    };
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

    this.#resetWarning();
    this.safeUpdate({ status: 'in_progress' });

    return this.#findAndSetNextQuestion([]);
  }

  /**
   * Отменяет заполнение анкеты: in_progress → abandoned.
   * @param reason — причина прерывания (обязательна): 'timeout' (планировщик
   *   по таймауту) или 'by_user' (ручное прерывание). Персистируется в
   *   состоянии (abandonReason) и попадает в payload события questionnaire:abandon.
   */
  abandon(reason: AbandonReason): void {
    if (this.state.status === 'abandoned') {
      return;
    }
    if (this.state.status === 'completed') {
      this.throwBadRequest('Анкета не активна');
    }
    // Рантайм-проверка: без валидного reason прерывать нельзя (инвариант агрегата)
    if (!v.is(AbandonReasonSchema, reason)) {
      this.throwBadRequest('Причина прерывания обязательна: timeout | by_user');
    }
    this.safeUpdate({ status: 'abandoned', abandonReason: reason });
    this.addEvent(this.buildAbandonedEvent(reason));
  }

  /**
   * Отказывается от приглашения: invited → abandoned.
   * Отказ — ручное действие пользователя, поэтому reason = 'by_user'
   * (инвариант: abandoned ⇒ abandonReason заполнен).
   */
  decline(): void {
    if (this.state.status !== 'invited') {
      this.throwBadRequest(
        'Анкета не в статусе invited, невозможно отказаться',
      );
    }
    this.safeUpdate({ status: 'abandoned', abandonReason: 'by_user' });
    this.addEvent(this.buildDeclinedEvent());
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
      value === BaseQuestionnaireAr.getNextButtonText(this.currentQuestionCode)
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
    this.#resetWarning();

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
      return { type: 'completed', questionnaireId: this.state.uuid };
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
          questionnaireId: this.state.uuid,
          currentQuestion: question,
          selectedAnswers,
          nextButton: BaseQuestionnaireAr.getNextButtonText(questionCode),
          cancelWarning: this.#cancelWarning(),
          ...this.#progress(question.questionCode),
        };
      }
    }

    const draft = this.state.draftAnswers[questionCode] ?? '';
    const selectedAnswers = draft ? draft.split(',').filter(Boolean) : [];

    return {
      type: 'new_question',
      questionnaireId: this.state.uuid,
      question,
      selectedAnswers,
      cancelWarning: this.#cancelWarning(),
      ...this.#progress(question.questionCode),
    };
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

    const newDraft: Record<string, string> = {
      ...this.state.draftAnswers,
    };
    if (newAnswers.length > 0) {
      newDraft[questionCode] = newAnswers.join(',');
    } else {
      delete newDraft[questionCode];
    }

    this.safeUpdate({ draftAnswers: newDraft });

    const response: QuestionnaireActionResponse = {
      type: 'wait_next',
      questionnaireId: this.state.uuid,
      currentQuestion: question,
      selectedAnswers: newAnswers,
      cancelWarning: this.#cancelWarning(),
      ...this.#progress(question.questionCode),
    };
    if (newAnswers.length > 0) {
      response.nextButton = BaseQuestionnaireAr.getNextButtonText(questionCode);
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
    const newDraft: Record<string, string> = {
      ...this.state.draftAnswers,
    };
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
        questionnaireId: this.state.uuid,
        question: nextQuestion,
        selectedAnswers: [],
        previousQuestion,
        previousSelectedAnswers: lastSelectedAnswers,
        cancelWarning: this.#cancelWarning(),
        ...this.#progress(nextQuestion.questionCode),
      };
    }

    this.safeUpdate({
      status: 'completed',
      currentQuestionCode: null,
      completedAt: isoNow(),
    });
    this.addEvent(this.buildCompletedEvent());

    return {
      type: 'completed',
      questionnaireId: this.state.uuid,
      selectedAnswers: lastSelectedAnswers,
      previousQuestion,
      previousSelectedAnswers: lastSelectedAnswers,
      completionText: this.state.questionPool.completionText,
    };
  }

  // ═════════════════════════════════════════════════════════════
  // Утилиты
  // ═════════════════════════════════════════════════════════════

  /**
   * Переопределяем safeUpdate с типом базового состояния анкеты,
   * чтобы частичные обновления не зависели от generic-состояния.
   */
  protected override safeUpdate(
    partial: Partial<BaseQuestionnaireState>,
  ): void {
    super.safeUpdate(partial as Partial<TMeta['state']>);
  }

  // ═════════════════════════════════════════════════════════════
  // Приватные хелперы
  // ═════════════════════════════════════════════════════════════

  #cancelWarning(): string | undefined {
    return this.state.questionPool.cancelWarning;
  }

  /** Прогресс вопроса в пуле — для шапки «Вопрос N из M» в UI. */
  #progress(
    questionCode: string,
  ): { questionIndex: number; poolSize: number } | undefined {
    const progress = this.#engine.getProgress(questionCode);
    if (!progress) return undefined;
    return { questionIndex: progress.index, poolSize: progress.total };
  }

  #checkIsInProgress(): void {
    if (this.state.status !== 'in_progress') {
      this.throwBadRequest('Анкета уже завершена');
    }
  }

  /** Сброс предупреждения о закрытии — пользователь проявил активность. */
  #resetWarning(): void {
    delete this._state.warnedAt;
  }

  #getQuestion(questionCode: string): Question {
    const question = this.#engine.getByCode(questionCode);
    if (!question) {
      this.throwBadRequest(`Вопрос "${questionCode}" не найден в пуле`);
    }
    return question;
  }
}
