import type { User } from '@u7-scl/app/domain';
import { BotController, type BotResponse, type ProactiveSender } from '@u7-scl/core/ui';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { U7BotUiStory } from './u7-bot-ui-story';
import type { MainMenuAction, MenuAggregator } from './u7-menu';

/**
 * Специализированный контроллер для U7 Telegram-бота.
 *
 * Закрывает дженерики `U7BotAppMeta`, `User` и добавляет систему меню.
 */
export abstract class U7BotController extends BotController<
  U7BotAppMeta,
  User,
  U7BotUiAppResolve
> {
  protected declare readonly stories: U7BotUiStory[];

  /** Агрегатор меню — передаётся через resolve при инициализации */
  protected uiApp!: MenuAggregator<User>;

  override init(
    resolve: U7BotUiAppResolve,
    proactiveSender?: ProactiveSender,
  ): void {
    this.uiApp = resolve.uiApp;
    super.init(resolve, proactiveSender);
  }

  /** Главное меню — агрегирует кнопки от всех стори. */
  async handleStart(actor: User): Promise<MainMenuAction[]> {
    const items: MainMenuAction[] = [];
    for (const story of this.stories) {
      const item = await story.handleStart(actor);
      if (item) {
        if (item.kind === 'url') {
          items.push(item);
        } else {
          items.push({
            ...item,
            action: `${this.name}:${item.action}`,
          });
        }
      }
    }
    return items.sort((a, b) => a.priority - b.priority);
  }

  /** Приветствие /start. По умолчанию контроллер не участвует. */
  async handleWelcome(_actor: User): Promise<BotResponse | null> {
    return null;
  }

  /** Сообщение помощи /help. По умолчанию контроллер не участвует. */
  async handleHelpMessage(_actor: User): Promise<BotResponse | null> {
    return null;
  }
}
