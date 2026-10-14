import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';

/**
 * SH02: Экран «Инфо» школы.
 */
export class SchoolInfoStory extends U7BotUiStory {
  readonly name = 'info';

  override async menuButtons(_actor: User): Promise<MenuButton[]> {
    return [];
  }

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    return this.unknownCommand(action, actor, session);
  }
}
