import type { AppResolver } from '@u7-scl/core/domain';
import type { StreamFacade } from '@u7-scl/stream/domain';
import { PeerReviewApiModule } from '#api/module';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import { ReviewCampaignJsonRepo } from './db/review-campaign-json-repo';
import { ReviewJsonRepo } from './db/review-json-repo';
import { PeerReviewInProcFacade } from './peer-review-in-proc-facade';

/** Результат bootstrap-сборки модуля peer-review. */
export interface PeerReviewBootstrap {
  /** API-модуль — регистрируется в ApiApp. */
  module: PeerReviewApiModule;
  /** Фасад модуля — для других модулей и UI. */
  facade: PeerReviewInProcFacade;
}

/**
 * Bootstrap-сборка модуля peer-review: json-репозитории (ФР-9), резолвер,
 * API-модуль и фасад. Подписка ER `create-student-campaign` на события
 * судьбы студента выполняется в `module.init()` при старте приложения
 * (`apiApp.init()`).
 */
export function peerReviewBootstrap(input: {
  /** Каталог БД приложения (config.dbDir). */
  dbDir: string;
  /** Фасад stream — состав окружения субъекта окна. */
  streamFacade: StreamFacade;
  /** Системные зависимости уровня приложения. */
  appResolver: AppResolver;
}): PeerReviewBootstrap {
  const reviewCampaignRepo = new ReviewCampaignJsonRepo(
    `${input.dbDir}/peer-review/campaigns.json`,
  );
  const reviewRepo = new ReviewJsonRepo(
    `${input.dbDir}/peer-review/reviews.json`,
  );

  const resolver: PeerReviewApiModuleResolver = {
    reviewCampaignRepo,
    reviewRepo,
    streamFacade: input.streamFacade,
    appResolver: input.appResolver,
    eventBus: input.appResolver.eventBus,
  };

  const module = new PeerReviewApiModule(resolver);
  const facade = new PeerReviewInProcFacade(module);

  return { module, facade };
}
