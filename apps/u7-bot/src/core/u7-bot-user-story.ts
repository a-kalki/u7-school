import type { User } from '@u7-scl/app/domain';
import { BotUserStory } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from './u7-bot-app-meta';

/**
 * Специализированный пользовательский сценарий для U7 Telegram-бота.
 */
export abstract class U7BotUserStory extends BotUserStory<U7BotAppMeta, User> {}
