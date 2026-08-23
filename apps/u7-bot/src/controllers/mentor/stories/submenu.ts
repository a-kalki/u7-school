import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { MAIN_MENU_BUTTON } from '../../shared/constants';

/**
 * Подменю «🛠️ Инструменты ментора».
 * Доступно только ролям MENTOR и ADMIN.
 */
export class SubmenuStory extends U7BotUserStory {
  readonly name = 'submenu';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    if (!this.#isMentor(actor)) {
      return {
        sendMessage: {
          text: '⚠️ У вас нет доступа к инструментам ментора.',
        },
      };
    }

    if (action === 'start') {
      return this.#buildSubmenu();
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {
      sendMessage: { text: '⚠️ Используйте кнопки меню для навигации.' },
    };
  }

  override async handleStart(actor: User): Promise<MainMenuAction | null> {
    if (this.#isMentor(actor)) {
      return {
        kind: 'callback',
        text: '🛠️ Инструменты ментора',
        action: this.cb('start'),
        priority: 30,
        description:
          '🛠️ Инструменты ментора — управление потоками и мониторинг студентов',
      };
    }
    return null;
  }

  // ── Приватные методы ──

  #isMentor(actor: User): boolean {
    return (
      actor.roles.includes(Role.MENTOR) || actor.roles.includes(Role.ADMIN)
    );
  }

  #buildSubmenu(): BotResponse {
    return {
      sendMessage: {
        text: '🛠️ *Инструменты ментора*',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [{ text: '📋 Мои потоки', code: this.cbFor('my-streams', 'list') }],
            [
              {
                text: '➕ Создать поток',
                code: this.cbFor('create-stream', 'start'),
              },
            ],
            [
              {
                text: '🔙 Назад',
                code: MAIN_MENU_BUTTON.code,
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }
}
