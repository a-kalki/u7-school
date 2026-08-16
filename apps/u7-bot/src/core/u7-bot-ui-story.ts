import type { User } from '@u7-scl/app/domain';
import { BotUiStory } from '@u7-scl/core/ui';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { MainMenuAction } from './u7-menu';

/**
 * Специализированный пользовательский сценарий для U7 Telegram-бота.
 */
export abstract class U7BotUiStory extends BotUiStory<
  U7BotAppMeta,
  User,
  U7BotUiAppResolve
> {
  /** Кнопка в главном меню. По умолчанию сценарий не показывается в меню. */
  async handleStart(_actor: User): Promise<MainMenuAction | null> {
    return null;
  }
}
