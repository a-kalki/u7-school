import type { DomainEvent } from '@u7-scl/core/domain';
import type { CampaignContext } from './entity';

/**
 * Событие создания студенческой кампании отзывов (ФР-5).
 * Получатели приглашений UI: субъект (subjectId) и ментор скоупа.
 */
export interface StudentCampaignCreatedEvent extends DomainEvent {
  eventName: 'student-campaign.created';
  aggregateName: 'ReviewCampaign';
  payload: {
    campaignId: string;
    context: CampaignContext;
    scopeId: string;
    subjectId: string;
  };
}
