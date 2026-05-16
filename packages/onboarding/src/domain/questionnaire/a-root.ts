import { Aggregate } from '@u7/core/domain';
import { isoNow } from '@u7/core/shared';
import * as v from 'valibot';
import type { AnswerEntry, Questionnaire, QuestionnaireArMeta } from './entity';
import { QuestionnaireSchema } from './entity';
import type { Question } from './question';
import type { QuestionPoolService } from './question-pool-service';
import type { QuestionnaireActionResponse } from './types';

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

  isCompleted(): boolean {
    return this.state.status === 'completed';
  }

  /**
   * Универсальный метод обработки действий пользователя.
   * Агрегат сам знает текущий вопрос и проверяет корректность ответа.
   */
  handleAction(action: {
    type: 'callback' | 'text';
    value: string;
  }): QuestionnaireActionResponse {
    this.checkIsInProgress();

    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode);

    // 1. Если пришла команда 'next' (сабмит черновиков)
    if (action.value === 'next') {
      if (question.type !== 'choice' || !question.multiple) {
        this.throwBadRequest(
          'Команда next доступна только для вопросов с множественным выбором',
        );
      }
      return this.submitCurrentQuestion();
    }

    // 2. Обработка текстового вопроса
    if (question.type === 'text') {
      return this.submitCurrentQuestion(action.value);
    }

    // 3. Обработка вопроса с выбором
    if (question.type === 'choice') {
      const answerCode = action.value;

      if (!answerCode) {
        this.throwBadRequest('Код ответа не может быть пустым');
      }

      if (question.multiple) {
        // Переключаем черновик
        const draft = this.state.draftAnswers ?? [];
        const idx = draft.indexOf(answerCode);
        const newDraft: string[] =
          idx >= 0
            ? draft.filter((c) => c !== answerCode)
            : [...draft, answerCode];

        this.safeUpdate({ draftAnswers: newDraft });

        const response: QuestionnaireActionResponse = {
          type: 'wait_next',
          question,
          selectedAnswers: newDraft,
        };
        if (newDraft.length > 0) {
          response.nextButton = `next:${questionCode}`;
        }
        return response;
      } else {
        // Одиночный выбор - сабмитим сразу
        return this.submitCurrentQuestion(answerCode);
      }
    }

    this.throwInternal(
      `Неизвестный тип вопроса: ${(question as { type: string }).type}`,
    );
  }

  /** Принимает и валидирует ответ, переходит к следующему вопросу */
  protected submitCurrentQuestion(
    value?: string[] | string,
  ): QuestionnaireActionResponse {
    const questionCode = this.currentQuestionCode;
    const question = this.getQuestion(questionCode);

    // Если значение не передано явно, берем из черновика
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
    const lastQuestionSelectedAnswers = entry.answerCodes;
    this.safeUpdate({ draftAnswers: [] });

    return this.findAndSetNextQuestion(lastQuestionSelectedAnswers);
  }

  /** Определяет следующий вопрос с учётом ветвления и обновляет стейт */
  protected findAndSetNextQuestion(
    lastQuestionSelectedAnswers: string[],
  ): QuestionnaireActionResponse {
    const nextQuestion = this.#poolService.getNextQuestion(
      this.state.currentQuestionCode,
      this.state.answers,
    );

    if (nextQuestion) {
      this.safeUpdate({ currentQuestionCode: nextQuestion.questionCode });
      return {
        type: 'new_question',
        question: nextQuestion,
        selectedAnswers: lastQuestionSelectedAnswers,
      };
    }

    this.safeUpdate({ status: 'completed', currentQuestionCode: null });
    return { type: 'completed', selectedAnswers: lastQuestionSelectedAnswers };
  }

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
        question,
        selectedAnswers: this.state.draftAnswers ?? [],
        nextButton: `next:${questionCode}`,
      };
    }

    return {
      type: 'new_question',
      question,
      selectedAnswers: this.state.draftAnswers ?? [],
    };
  }

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
