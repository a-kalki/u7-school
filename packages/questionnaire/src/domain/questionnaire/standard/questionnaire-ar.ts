import { isoNow } from '@u7-scl/core/shared';
import { BaseQuestionnaireAr } from '../a-root';
import type { BaseQuestionnaireArMeta } from '../entity';
import { type Questionnaire, QuestionnaireSchema } from '../entity';
import type {
  QuestionnaireAbandoned,
  QuestionnaireCompleted,
  QuestionnaireDeclined,
} from '../events';

/** Метатип обычной анкеты */
export interface StandardQuestionnaireArMeta extends BaseQuestionnaireArMeta {
  state: Questionnaire;
  events:
    | QuestionnaireCompleted
    | QuestionnaireDeclined
    | QuestionnaireAbandoned;
}

/** Обычная анкета: публикует события завершения/отказа/прерывания. */
export class QuestionnaireAr extends BaseQuestionnaireAr<StandardQuestionnaireArMeta> {
  constructor(state: Questionnaire) {
    super(state, QuestionnaireSchema);
  }

  /** Общие поля payload событий обычной анкеты. */
  private basePayload() {
    return {
      questionnaireId: this.state.uuid,
      respondentId: this.state.respondentId,
    };
  }

  protected buildCompletedEvent(): QuestionnaireCompleted {
    return {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire.completed',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: this.state.uuid,
      payload: this.basePayload(),
    };
  }

  protected buildDeclinedEvent(): QuestionnaireDeclined {
    return {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire.declined',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: this.state.uuid,
      payload: this.basePayload(),
    };
  }

  protected buildAbandonedEvent(): QuestionnaireAbandoned {
    return {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire.abandoned',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: this.state.uuid,
      payload: this.basePayload(),
    };
  }
}
