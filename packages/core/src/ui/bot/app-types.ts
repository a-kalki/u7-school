import type { ApiApp } from '#api/index';
import type { AppMeta } from '#domain/types';
import type { UiAppResolve } from '#ui/types';

/**
 * Зависимости UI-слоя бота.
 */
export interface BotUiAppResolve<
  TAppMeta extends AppMeta = AppMeta,
  TActor = unknown,
> extends UiAppResolve {
  /** Резолвер актора по Telegram ID */
  actorResolver: (tgId: number) => Promise<TActor>;
  appApi: ApiApp<TAppMeta>;
}
