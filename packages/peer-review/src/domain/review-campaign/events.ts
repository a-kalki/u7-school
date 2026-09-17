import type { DomainEvent } from '@u7-scl/core/domain';
import type { CampaignContext } from './entity';

/**
 * Событие создания кампании сбора отзывов.
 *
 * Основа приглашений участников (экран S01 трека peer-review-ui):
 * подписчики читают payload и зовут своих. Домен о доставке не знает.
 */
export interface CampaignCreatedEvent extends DomainEvent {
  eventName: 'campaign.created';
  aggregateName: 'ReviewCampaign';
  payload: {
    /** uuid кампании */
    campaignId: string;
    /** Контекст кампании (дискриминант) */
    context: CampaignContext;
    /** uuid скоупа (для stream_completed — streamId) */
    scopeId: string;
  };
}
