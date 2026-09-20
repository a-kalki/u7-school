import type { User } from '@u7-scl/app/domain';
import { getGlobalLogger, type Logger } from '@u7-scl/core/shared';
import {
  BotController,
  type DialogCache,
  type ProactiveSender,
} from '@u7-scl/core/ui';
import { APP_CODES } from '../shared/app-codes';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { U7BotUiStory } from './u7-bot-ui-story';
import type { MenuButton } from './u7-menu';

/**
 * Специализированный контроллер для U7 Telegram-бота.
 *
 * Закрывает дженерики `U7BotAppMeta`, `User`; в pipe команд — дефолт ядра
 * (свои стори с агрегацией). Меню — декларативные `menuButtons`,
 * welcome/help-тексты — U7BotUiApp.
 */
export abstract class U7BotController extends BotController<
  U7BotAppMeta,
  User,
  U7BotUiAppResolve
> {
  declare protected readonly stories: U7BotUiStory[];

  /** Кнопка выхода на экранах ошибок: «⬅️ Меню» (системный код приложения). */
  protected override errorExitRows(): { text: string; code: string }[][] {
    return [[{ text: '⬅️ Меню', code: APP_CODES.mainMenu }]];
  }

  /**
   * Кнопки главного меню контроллера: ПАРАЛЛЕЛЬНЫЙ сбор от своих стори
   * (`Promise.all` — проверки видимости могут звать фасады, ФР-7);
   * упавшая стори скрывает только свои кнопки + warn (меню цело).
   * Callback-коды префиксуются именем контроллера, сортировка по
   * приоритету. Декларативные данные — экран строит uiApp.
   */
  async menuButtons(actor: User): Promise<MenuButton[]> {
    const chunks = await Promise.all(
      this.stories.map(async (story) => {
        try {
          return await story.menuButtons(actor);
        } catch (err) {
          this.#logger?.warn(
            'menu',
            'Стори упала в сборе menuButtons — её кнопки скрыты',
            { error: String(err), story: story.dialogPath },
          );
          return [];
        }
      }),
    );
    return chunks
      .flat()
      .map((button) =>
        button.kind === 'callback'
          ? { ...button, action: `${this.name}:${button.action}` }
          : button,
      )
      .sort((a, b) => a.priority - b.priority);
  }

  get #logger(): Logger | undefined {
    return getGlobalLogger();
  }

  override init(
    resolve: U7BotUiAppResolve,
    proactiveSender?: ProactiveSender,
    dialogCache?: DialogCache,
  ): void {
    super.init(resolve, proactiveSender, dialogCache);
  }
}
