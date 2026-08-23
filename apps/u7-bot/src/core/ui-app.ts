import type { User } from '@u7-scl/app/domain';
import type { ApiApp } from '@u7-scl/core/api';
import { UiApp } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from './u7-bot-app-meta';

/**
 * Оркестратор UI приложения U7 Bot.
 *
 * Наследует всю маршрутизацию от UiApp из core.
 * Закрывает дженерики: TAppMeta = U7BotAppMeta, TActor = User.
 *
 * Поток:
 *   new U7BotUiApp([controllers])
 *   uiApp.init(apiApp)   // каскад: apiApp → контроллеры → стори
 *   connectUiApp(grammyBot, uiApp, ...)
 */
export class U7BotUiApp extends UiApp<U7BotAppMeta, User> {
  /**
   * Каскадная инициализация: ApiApp → контроллеры → стори.
   */
  override init(apiApp: ApiApp<U7BotAppMeta>): void {
    super.init(apiApp);
  }
}
