import { isoNow } from '@u7-scl/core/shared';
import { BaseQuestionnaireAr } from '../a-root';
import type { BaseQuestionnaireArMeta } from '../entity';
import { type Questionnaire, QuestionnaireSchema } from '../entity';
import type {
  QuestionnaireAbandonEvent,
  QuestionnaireCompleteEvent,
  QuestionnaireDeclineEvent,
} from '../events';

/** Метатип обычной анкеты */
export interface StandardQuestionnaireArMeta extends BaseQuestionnaireArMeta {
  state: Questionnaire;
  events:
    | QuestionnaireCompleteEvent
    | QuestionnaireDeclineEvent
    | QuestionnaireAbandonEvent;
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

  protected buildCompletedEvent(): QuestionnaireCompleteEvent {
    return {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire:complete',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: this.state.uuid,
      ownerInfo: this.state.ownerInfo,
      payload: this.basePayload(),
    };
  }

  protected buildDeclinedEvent(): QuestionnaireDeclineEvent {
    return {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire:decline',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: this.state.uuid,
      ownerInfo: this.state.ownerInfo,
      payload: this.basePayload(),
    };
  }

  protected buildAbandonedEvent(reason?: 'timeout'): QuestionnaireAbandonEvent {
    return {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire:abandon',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: this.state.uuid,
      ownerInfo: this.state.ownerInfo,
      payload: reason ? { ...this.basePayload(), reason } : this.basePayload(),
    };
  }
}
