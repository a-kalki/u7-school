import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';
import { UserPolicy } from '@u7-scl/user/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US: Подменю «🛠️ Инструменты ментора».
 *
 * Доступно только MENTOR и ADMIN. Содержит:
 * - «📋 Мои потоки» — список потоков ментора → S02m mentor-режим
 * - «➕ Создать поток» — перенос из главного меню в подменю
 *
 * Мониторинг студентов — через кнопку «👥 Студенты» в карточке потока (S02m).
 */
export class MentorToolsStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'mentor-tools';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    // Проверка доступа
    if (!UserPolicy.isMentor(actor) && !UserPolicy.isAdmin(actor)) {
      return {
        sendMessage: {
          text: '⚠️ У вас нет доступа к инструментам ментора.',
        },
      };
    }

    if (action === 'start') {
      return this.#buildSubmenu();
    }

    // «Мои потоки» — список потоков ментора
    if (action === 'my-streams') {
      return this.#handleMyStreams(actor);
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

  override async handleStart(actor: User) {
    if (UserPolicy.isMentor(actor) || UserPolicy.isAdmin(actor)) {
      return {
        kind: 'callback' as const,
        text: '🛠️ Инструменты ментора',
        action: this.cb('start'),
        priority: 10,
        description:
          '🛠️ Инструменты ментора — управление потоками и мониторинг студентов',
      };
    }
    return null;
  }

  // ── Приватные методы ──

  #buildSubmenu(): BotResponse {
    return {
      sendMessage: {
        text: '🛠️ *Инструменты ментора*',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [{ text: '📋 Мои потоки', code: this.cb('my-streams') }],
            [
              {
                text: '➕ Создать поток',
                code: this.cbFor('create-stream', 'start'),
              },
            ],
            [{ text: '🔙 Назад', code: 'app:main-menu' }],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #handleMyStreams(actor: User): Promise<BotResponse> {
    try {
      const streams = await this.moduleApi.execute('list-streams', {});

      // Фильтруем потоки, где actor является ментором
      const myStreams = Array.isArray(streams)
        ? streams.filter((s: { mentorId: string }) => s.mentorId === actor.uuid)
        : [];

      if (myStreams.length === 0) {
        return {
          sendMessage: {
            text: '📋 *Мои потоки*\n\nУ вас пока нет потоков.',
            parseMode: 'MarkdownV2',
            keyboard: {
              rows: [[{ text: '🔙 Назад', code: this.cb('start') }]],
              isMultiple: false,
            },
          },
        };
      }

      const rows = myStreams.map(
        (s: { uuid: string; title: string; status: string }) => [
          {
            text: `${s.title} (${s.status})`,
            code: this.cbFor('view-stream', 'view', s.uuid),
          },
        ],
      );

      rows.push([{ text: '🔙 Назад', code: this.cb('start') }]);

      return {
        sendMessage: {
          text: '📋 *Мои потоки*',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows,
            isMultiple: false,
          },
        },
      };
    } catch {
      return {
        sendMessage: {
          text: '⚠️ Не удалось загрузить список потоков.',
        },
      };
    }
  }
}
