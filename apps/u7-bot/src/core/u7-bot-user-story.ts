import type { User } from '@u7-scl/app/domain';
import { BotUserStory, type StoryPublicActions } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from './u7-bot-app-meta';

/**
 * Специализированный пользовательский сценарий для U7 Telegram-бота.
 */
export abstract class U7BotUserStory<
  TActions extends StoryPublicActions = StoryPublicActions,
> extends BotUserStory<U7BotAppMeta, User, TActions> {}
