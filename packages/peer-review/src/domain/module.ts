import type { ModuleResolver } from '@u7-scl/core/domain';
import type { StreamFacade } from '@u7-scl/stream/domain';
import type { ReviewRepo } from './review/repo';
import type { ReviewCampaignRepo } from './review-campaign/repo';

/**
 * Резолвер зависимостей API-модуля peer-review.
 */
export interface PeerReviewApiModuleResolver extends ModuleResolver {
  reviewCampaignRepo: ReviewCampaignRepo;
  reviewRepo: ReviewRepo;
  /** Сбор участников завершённого потока (ментор + студенты с исходами). */
  streamFacade: StreamFacade;
}

/**
 * Метаданные API-модуля peer-review.
 * ucMetas заполняются по мере появления UC (Фаза 4).
 */
export interface PeerReviewApiModuleMeta {
  name: 'peer-review';
  url: '/peer-review';
  ucMetas: never;
}
