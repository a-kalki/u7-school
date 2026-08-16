import type { User } from '@u7-scl/app/domain';
import type { BotUiResolve } from '@u7-scl/core/ui';
import { BotUiApp } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from './u7-bot-app-meta';

/**
 * Оркестратор UI приложения U7 Bot.
 */
export class U7BotUiApp extends BotUiApp<U7BotAppMeta, User> {
  /**
   * Инициализация зависимостями UI-слоя U7-бота.
   *
   * @param resolve — зависимости (appApi, uiApp, eventBus, actorResolver)
   */
  override init(resolve: BotUiResolve<U7BotAppMeta, User>): void {
    super.init(resolve);
  }
}
