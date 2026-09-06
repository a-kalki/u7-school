import type { User } from '@u7-scl/app/domain';
import { BotController, type ProactiveSender } from '@u7-scl/core/ui';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { U7BotUiStory } from './u7-bot-ui-story';
import type { MenuButton } from './u7-menu';

/**
 * Специализированный контроллер для U7 Telegram-бота.
 *
 * Закрывает дженерики `U7BotAppMeta`, `User`; в pipe команд — дефолт ядра
 * (свои стори с агрегацией). Именных обработчиков (handleStart /
 * handleWelcome / handleHelpMessage) нет: меню — декларативные
 * `menuButtons`, welcome/help-тексты — U7BotUiApp.
 */
export abstract class U7BotController extends BotController<
  U7BotAppMeta,
  User,
  U7BotUiAppResolve
> {
  protected declare readonly stories: U7BotUiStory[];

  /**
   * Кнопки главного меню контроллера: сбор от своих стори, callback-коды
   * префиксуются именем контроллера, сортировка по приоритету.
   * Декларативные данные — экран строит uiApp.
   */
  menuButtons(actor: User): MenuButton[] {
    return this.stories
      .flatMap((story) => story.menuButtons(actor))
      .map((button) =>
        button.kind === 'callback'
          ? { ...button, action: `${this.name}:${button.action}` }
          : button,
      )
      .sort((a, b) => a.priority - b.priority);
  }

  override init(
    resolve: U7BotUiAppResolve,
    proactiveSender?: ProactiveSender,
  ): void {
    super.init(resolve, proactiveSender);
  }
}
