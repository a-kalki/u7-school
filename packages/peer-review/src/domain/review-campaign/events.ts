import type { DomainEvent } from '@u7-scl/core/domain';
import type { CampaignContext, StudentOutcome } from './entity';

/**
 * Событие создания студенческой кампании отзывов (ФР-5).
 * Получатели приглашений UI: субъект (subjectId) и ментор скоупа.
 * Payload несёт полные данные (mentorId, subjectOutcome) — агрегат
 * владелец данных; заголовок потока UI берёт сам (get-stream).
 */
export interface StudentCampaignCreatedEvent extends DomainEvent {
  eventName: 'student-campaign.created';
  aggregateName: 'ReviewCampaign';
  payload: {
    campaignId: string;
    context: CampaignContext;
    scopeId: string;
    subjectId: string;
    mentorId: string;
    subjectOutcome: StudentOutcome;
  };
}
