import type { DomainEvent } from '@u7-scl/core/domain';
import type { CampaignContext } from './entity';

/**
 * Событие создания кампании сбора отзывов.
 */
export interface CampaignCreatedEvent extends DomainEvent {
  eventName: 'campaign.created';
  aggregateName: 'ReviewCampaign';
  payload: {
    campaignId: string;
    context: CampaignContext;
    scopeId: string;
  };
}
