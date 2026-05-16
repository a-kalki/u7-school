import {
  Aggregate,
  errConflict,
  errValidation,
  throwError,
} from '@u7/core/domain';
import { isoNow } from '@u7/core/shared';
import * as v from 'valibot';
import type { AnswerEntry, Questionnaire, QuestionnaireArMeta } from './entity';
import { QuestionnaireSchema } from './entity';
import type {
  QuestionnaireCompletedUcError,
  QuestionnaireValidationUcError,
} from './errors';
import type { Question } from './question';
import type { QuestionPoolService } from './question-pool-service';

/** Агрегат прохождения анкеты */
export class QuestionnaireAr extends Aggregate<QuestionnaireArMeta> {
  readonly #poolService: QuestionPoolService;
  /** Коды вопросов, включённых в эту анкету (подмножество пула) */
  readonly #includedQuestionCodes: string[];

  constructor(
    state: Questionnaire,
    poolService: QuestionPoolService,
    includedQuestionCodes: string[],
  ) {
    super(state, QuestionnaireSchema);
    this.#poolService = poolService;
    this.#includedQuestionCodes = includedQuestionCodes;
  }

  /** Возвращает текст вопроса по коду или сам код, если вопрос не найден */
  #getQuestionText(code: string): string {
    const q = this.#poolService.getByCode(code);
    return q ? q.question : code;
  }

  /**
   * Фабричный метод — создаёт новую анкету и определяет первый вопрос.
   * @param includedQuestionCodes — коды вопросов, включённых в анкету (подмножество пула)
   */
  static start(
    telegramId: number,
    poolService: QuestionPoolService,
    includedQuestionCodes: string[],
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
    const ar = new QuestionnaireAr(state, poolService, includedQuestionCodes);
    ar.getNextQuestion();
    return ar;
  }

  isCompleted(): boolean {
    return this.state.status === 'completed';
  }

  /**
   * Добавляет или удаляет черновой ответ для текущего вопроса
   */
  toggleDraftAnswer(questionCode: string, answerCode: string): void {
    this.checkIsInProgress();
    this.checkIsCurrentQuestionCode(questionCode);
    const question = this.getQuestion(questionCode);

    if (question.type !== 'choice') {
      this.throwBadRequest(
        'Черновики поддерживаются только для вопросов с выбором',
      );
    }

    const draft = this.state.draftAnswers ?? [];
    const idx = draft.indexOf(answerCode);

    let newDraft: string[];
    if (idx >= 0) {
      newDraft = draft.filter((c) => c !== answerCode);
    } else {
      // Для одиночного выбора - заменяем, для множественного - добавляем
      if (question.multiple) {
        newDraft = [...draft, answerCode];
      } else {
        newDraft = [answerCode];
      }
    }

    this.safeUpdate({ draftAnswers: newDraft });
  }

  /** Принимает и валидирует ответ, переходит к следующему вопросу */
  submitAnswer(questionCode: string, value?: string[] | string): void {
    this.checkIsInProgress();
    this.checkIsCurrentQuestionCode(questionCode);
    const question = this.getQuestion(questionCode);

    // Если значение не передано явно, пытаемся взять из черновика
    let actualValue = value;
    if (actualValue === undefined) {
      const draft = this.state.draftAnswers ?? [];
      if (question.type === 'choice' && !question.multiple) {
        actualValue = draft[0];
      } else {
        actualValue = draft;
      }
    }

    const schema = this.#poolService.buildValidationSchema(questionCode);
    try {
      v.parse(schema, actualValue);
    } catch (e) {
      if (e instanceof v.ValiError) {
        const qText = this.#getQuestionText(questionCode);
        throwError(
          errValidation<QuestionnaireValidationUcError>(
            'QUESTIONNAIRE_VALIDATION',
            `Некорректный ответ на вопрос "${qText}"`,
            { questionCode, issues: [e.message] },
          ),
        );
      }
      throw e;
    }

    const entry: AnswerEntry = {
      questionCode,
      answerCodes:
        question.type === 'choice'
          ? Array.isArray(actualValue)
            ? actualValue
            : [actualValue as string]
          : [],
      textValue:
        question.type === 'text'
          ? typeof actualValue === 'string'
            ? actualValue
            : undefined
          : undefined,
      answeredAt: isoNow(),
    };

    this._state.answers.push(entry);
    this.safeUpdate({ draftAnswers: [] });

    this.getNextQuestion();
  }

  /** Определяет следующий вопрос с учётом ветвления */
  getNextQuestion(): Question | null {
    let foundCurrent = this.state.currentQuestionCode === null;

    for (const code of this.#includedQuestionCodes) {
      if (!foundCurrent) {
        if (code === this.state.currentQuestionCode) {
          foundCurrent = true;
        }
        continue;
      }

      const question = this.#poolService.getByCode(code);
      if (!question) {
        this.throwBadRequest(
          `Вопрос "${this.#getQuestionText(code)}" не найден в пуле`,
        );
      }

      const condition = question.condition;
      if (!condition) {
        this.safeUpdate({ currentQuestionCode: question.questionCode });
        return question;
      }

      const conditionAnswer = this._state.answers.find(
        (a: AnswerEntry) => a.questionCode === condition.questionCode,
      );
      if (conditionAnswer) {
        const hasMatch = conditionAnswer.answerCodes.some((ac: string) =>
          condition.answerCodes.includes(ac),
        );
        if (hasMatch) {
          this.safeUpdate({ currentQuestionCode: question.questionCode });
          return question;
        }
      }
    }

    this.safeUpdate({ status: 'completed', currentQuestionCode: null });
    return null;
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
      throwError(
        errConflict<QuestionnaireCompletedUcError>(
          'QUESTIONNAIRE_COMPLETED',
          'Анкета уже завершена',
          { uuid: this.state.uuid },
        ),
      );
    }
  }

  protected checkIsCurrentQuestionCode(questionCode: string): void {
    if (this.state.currentQuestionCode !== questionCode) {
      const expected = this.#getQuestionText(
        this.state.currentQuestionCode ?? '',
      );
      const received = this.#getQuestionText(questionCode);
      this.throwBadRequest(
        `Ожидался вопрос "${expected}", получен "${received}"`,
      );
    }
  }

  protected getQuestion(questionCode: string): Question {
    const question = this.#poolService.getByCode(questionCode);
    if (!question) {
      this.throwBadRequest(
        `Вопрос "${this.#getQuestionText(questionCode)}" не найден в пуле`,
      );
    }
    return question;
  }
}
