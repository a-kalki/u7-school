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
  /** Состав окружения субъекта окна (ментор + студенты с исходами). */
  streamFacade: StreamFacade;
}

/**
 * Меты UC модуля peer-review.
 * Пользовательских UC пока нет — кампании создаёт ER (ФР-6);
 * пользовательские UC появятся с API-треком UI (ФР-7).
 */
export type PeerReviewUcMetas = never;

/**
 * Метаданные API-модуля peer-review.
 */
export interface PeerReviewApiModuleMeta {
  name: 'peer-review';
  url: '/peer-review';
  ucMetas: PeerReviewUcMetas;
}
