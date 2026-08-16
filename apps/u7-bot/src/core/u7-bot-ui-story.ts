import type { User } from '@u7-scl/app/domain';
import { BotUiStory } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from './u7-bot-app-meta';

/**
 * Специализированный пользовательский сценарий для U7 Telegram-бота.
 */
export abstract class U7BotUiStory extends BotUiStory<U7BotAppMeta, User> {}
