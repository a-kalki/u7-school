import type { User } from '@u7-scl/app/domain';
import type { ApiApp } from '@u7-scl/core/api';
import type { ApiModuleMeta } from '@u7-scl/core/domain';
import {
  type BotController,
  BotRouter,
  type MenuAggregator,
} from '@u7-scl/core/ui';
import type { U7BotAppMeta } from './u7-bot-app-meta';
import { createUiRegistry, type HasPublicActions } from './ui-actions';

/**
 * Оркестратор UI приложения U7 Bot.
 *
 * Владеет контроллерами и BotRouter, управляет каскадной инициализацией:
 * ApiApp → контроллеры → стори → UiRegistry → инжект ui.
 *
 * Аналог ApiApp для UI-слоя: ApiApp владеет Module[], UiApp владеет Controller[].
 *
 * Поток:
 *   new U7BotUiApp([controllers])
 *   uiApp.init(apiApp)
 *   connectRouter(grammyBot, uiApp.router, ...)
 */
export class U7BotUiApp {
  /** Универсальный роутер — маршрутизация callback/сообщений между контроллерами */
  readonly router: BotRouter<U7BotAppMeta, ApiModuleMeta, User>;

  private readonly controllers: BotController<
    U7BotAppMeta,
    ApiModuleMeta,
    User
  >[];

  constructor(controllers: BotController<U7BotAppMeta, ApiModuleMeta, User>[]) {
    this.controllers = controllers;
    this.router = new BotRouter(controllers);
  }

  /**
   * Каскадная инициализация:
   * 1. BotRouter.init(apiApp) — пробрасывает apiApp через контроллеры в стори
   * 2. Сбор UiRegistry из publicActions контроллеров
   * 3. Инжект ui во все стори через initUi()
   */
  init(apiApp: ApiApp<U7BotAppMeta>): void {
    // Шаг 1: ApiApp → контроллеры → стори
    this.router.init(apiApp);

    // Шаг 2: собираем UiRegistry из контроллеров
    const registry = createUiRegistry(this.controllers as HasPublicActions[]);

    // Шаг 3: инжектим UiRegistry во все стори
    for (const ctrl of this.controllers) {
      ctrl.initUi(registry);
    }
  }

  /**
   * Отдаёт MenuAggregator для AppController.initMenuAggregator().
   * BotRouter реализует MenuAggregator — он собирает кнопки со всех контроллеров.
   */
  getMenuAggregator(): MenuAggregator<User> {
    return this.router;
  }
}
