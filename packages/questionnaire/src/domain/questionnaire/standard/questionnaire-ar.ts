import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import { BaseQuestionnaireAr } from '../a-root';
import type { BaseQuestionnaireArMeta } from '../entity';
import { type Questionnaire, QuestionnaireSchema } from '../entity';
import type { QuestionnaireCompleted } from '../events';
import type { QuestionnairePool } from '../question';
import { QuestionnairePoolSchema } from '../question';

/** Метатип обычной анкеты */
export interface StandardQuestionnaireArMeta extends BaseQuestionnaireArMeta {
  state: Questionnaire;
  events: QuestionnaireCompleted;
}

/** Обычная анкета: публикует событие QuestionnaireCompleted. */
export class QuestionnaireAr extends BaseQuestionnaireAr<StandardQuestionnaireArMeta> {
  constructor(state: Questionnaire) {
    super(state, QuestionnaireSchema);
  }

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

  protected buildCompletedEvent(): QuestionnaireCompleted {
    return {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire.completed',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: this.state.uuid,
      payload: {
        questionnaireId: this.state.uuid,
        respondentId: this.state.respondentId,
      },
    };
  }
}
