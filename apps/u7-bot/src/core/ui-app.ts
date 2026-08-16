import type { User } from '@u7-scl/app/domain';
import type { ApiApp } from '@u7-scl/core/api';
import { BotUiApp } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from './u7-bot-app-meta';

/**
 * Оркестратор UI приложения U7 Bot.
 */
export class U7BotUiApp extends BotUiApp<U7BotAppMeta, User> {
  /**
   * Инициализация с резолвером актора.
   *
   * @param apiApp — приложение API
   * @param actorResolver — резолвер пользователя по telegramId
   */
  override init(
    apiApp: ApiApp<U7BotAppMeta>,
    actorResolver: (tgId: number) => Promise<User>,
  ): void {
    super.init(apiApp, actorResolver);
  }
}
