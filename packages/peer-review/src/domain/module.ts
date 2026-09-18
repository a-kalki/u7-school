import type { ModuleResolver } from '@u7-scl/core/domain';
import type { StreamFacade } from '@u7-scl/stream/domain';
import type { CreateReviewCmdMeta } from './review/commands/create-review-cmd';
import type { ListScopeFactsCmdMeta } from './review/commands/list-scope-facts-cmd';
import type { ListScopeReviewsCmdMeta } from './review/commands/list-scope-reviews-cmd';
import type { ReviewRepo } from './review/repo';
import type { GetCampaignRecipientsCmdMeta } from './review-campaign/commands/get-campaign-recipients-cmd';
import type { GetMyCampaignsCmdMeta } from './review-campaign/commands/get-my-campaigns-cmd';
import type { ReviewCampaignRepo } from './review-campaign/repo';

/**
 * Резолвер зависимостей API-модуля peer-review.
 */
export interface PeerReviewApiModuleResolver extends ModuleResolver {
  reviewCampaignRepo: ReviewCampaignRepo;
  reviewRepo: ReviewRepo;
  /** Состав окружения субъекта окна (ментор + студенты с исходами). */
  streamFacade: StreamFacade;
}

/** Меты UC модуля peer-review (ФР-7). */
export type PeerReviewUcMetas =
  | GetMyCampaignsCmdMeta
  | GetCampaignRecipientsCmdMeta
  | CreateReviewCmdMeta
  | ListScopeReviewsCmdMeta
  | ListScopeFactsCmdMeta;

/**
 * Метаданные API-модуля peer-review.
 */
export interface PeerReviewApiModuleMeta {
  name: 'peer-review';
  url: '/peer-review';
  ucMetas: PeerReviewUcMetas;
}
