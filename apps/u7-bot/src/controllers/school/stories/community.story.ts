import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { md } from '@u7-scl/core/shared';
import type { BotSession, BotUpdate, DialogResponse } from '@u7-scl/core/ui';

/**
 * CommunityStory: Стори сообщества школы.
 *
 * Перенесена из AppController в SchoolController (FR-7).
 * Кнопка сообщества вынесена из главного меню в хаб школы (SH01).
 */
export class CommunityStory extends U7BotUiStory {
  readonly name = 'community';
  readonly #groupUrl?: string;

  constructor(groupUrl?: string) {
    super();
    this.#groupUrl = groupUrl;
  }

  get groupUrl(): string {
    return this.#groupUrl ?? this.resolve.school.communityGroup.url;
  }

  /**
   * Кнопка из главного меню убрана (FR-7: вход через карточку школы SH01).
   */
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

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: BotSession,
  ): Promise<DialogResponse> {
    return this.screen(md`⚠️ Неизвестное сообщение`);
  }
}
