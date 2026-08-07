import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
  UiBotButton,
} from '@u7-scl/core/ui';

/**
 * Публичные действия CommunityStory.
 * Другие стори получают доступ через:
 *   this.uiApp.getAction<CommunityActions>('mainMenu')()
 */
export type CommunityActions = {
  mainMenu: () => UiBotButton;
};

/**
 * US: Кнопка «Сообщество школы» в главном меню.
 * Ведёт на URL группы школы в Telegram.
 * Доступна всем ролям.
 */
export class CommunityStory extends U7BotUserStory<CommunityActions> {
  readonly name = 'community';
  readonly #groupUrl: string;

  /**
   * Публичные действия для кросс-ссылок из других стори.
   */
  override readonly publicActions: CommunityActions = {
    mainMenu: () => ({
      text: '↩️ Главное меню',
      code: 'app:main-menu',
    }),
  };

  constructor(groupUrl: string) {
    super();
    this.#groupUrl = groupUrl;
  }

  override async handleStart(_actor: User): Promise<MainMenuAction | null> {
    return {
      kind: 'url',
      text: '💬 Сообщество школы',
      priority: 90,
      url: this.#groupUrl,
      description: '💬 Сообщество школы — ссылка на Telegram-группу школы',
    };
  }

  async handleCallback(
    _action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }
}
