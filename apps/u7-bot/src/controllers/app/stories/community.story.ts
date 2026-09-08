import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { md } from '@u7-scl/core/shared';
import type { BotSession, BotUpdate, DialogResponse } from '@u7-scl/core/ui';

/**
 * US: Кнопка «Сообщество школы» в главном меню.
 * Ведёт на URL группы школы в Telegram.
 * Доступна всем ролям.
 */
export class CommunityStory extends U7BotUiStory {
  readonly name = 'community';
  readonly #groupUrl: string;

  constructor(groupUrl: string) {
    super();
    this.#groupUrl = groupUrl;
  }

  override menuButtons(_actor: User): MenuButton[] {
    return [
      {
        kind: 'url',
        text: '💬 Сообщество школы',
        priority: 90,
        url: this.#groupUrl,
        description: '💬 Сообщество школы — ссылка на Telegram-группу школы',
      },
    ];
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
    return { screen: { text: md`⚠️ Неизвестное сообщение` } };
  }
}
