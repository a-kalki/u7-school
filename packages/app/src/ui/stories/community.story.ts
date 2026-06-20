import type { User } from '@u7-scl/app/domain';
import type { ApiModuleMeta } from '@u7-scl/core/domain';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { U7BotUserStory } from '../u7-bot-user-story';

/** Метаданные для stories без привязки к доменному модулю */
export interface AppOnlyApiModuleMeta extends ApiModuleMeta {
  name: 'app';
}

/**
 * US: Кнопка «Сообщество школы» в главном меню.
 * Ведёт на URL группы школы в Telegram.
 * Доступна всем ролям.
 */
export class CommunityStory extends U7BotUserStory<AppOnlyApiModuleMeta> {
  readonly name = 'community';
  readonly #groupUrl: string;

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
