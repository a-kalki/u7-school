import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';
import { UserPolicy } from '@u7-scl/user/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US: Подменю «🛠️ Инструменты ментора».
 */
export class MentorToolsStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'mentor-tools';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
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

    // «Мои потоки» с опциональными переключателями архивных/завершённых
    if (action.startsWith('my-streams')) {
      const showArchived = action.includes(':archived:1');
      const showCompleted = action.includes(':completed:1');
      return this.#handleMyStreams(actor, showArchived, showCompleted);
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
        priority: 30,
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

  async #handleMyStreams(
    actor: User,
    showArchived: boolean,
    showCompleted: boolean,
  ): Promise<BotResponse> {
    const LEGEND =
      '\n\n🟡 — идёт набор   🔵 — идёт обучение   🟢 — завершён   ⚫ — в архиве';

    try {
      const streams = await this.moduleApi.execute('list-streams', {});

      let myStreams = Array.isArray(streams)
        ? streams.filter(
            (s: { mentorId: string; status: string }) =>
              s.mentorId === actor.uuid,
          )
        : [];

      // По умолчанию — только запущенные и активные
      if (!showArchived && !showCompleted) {
        myStreams = myStreams.filter(
          (s: { status: string }) =>
            s.status === 'enrollment' || s.status === 'active',
        );
      } else {
        myStreams = myStreams.filter((s: { status: string }) => {
          if (s.status === 'archived') return showArchived;
          if (s.status === 'completed') return showCompleted;
          return true; // enrollment, active — всегда видно при включённых фильтрах
        });
      }

      const statusEmoji: Record<string, string> = {
        enrollment: '🟡',
        active: '🔵',
        completed: '🟢',
        archived: '⚫',
      };

      const rows: Array<Array<{ text: string; code: string }>> = [];

      // Переключатели
      const toggles: Array<{ text: string; code: string }> = [];
      if (!showArchived && !showCompleted) {
        toggles.push({
          text: '⚫ Вкл. архивированные',
          code: this.cb('my-streams:archived:1'),
        });
        toggles.push({
          text: '🟢 Вкл. завершённые',
          code: this.cb('my-streams:completed:1'),
        });
      } else if (showArchived && !showCompleted) {
        toggles.push({
          text: '🟢 Вкл. завершённые',
          code: this.cb('my-streams:archived:1:completed:1'),
        });
      } else if (!showArchived && showCompleted) {
        toggles.push({
          text: '⚫ Вкл. архивированные',
          code: this.cb('my-streams:completed:1:archived:1'),
        });
      }
      // Если оба включены — переключателей нет
      if (toggles.length > 0) {
        rows.push(toggles);
      }

      if (myStreams.length === 0) {
        rows.push([{ text: '🔙 Назад', code: this.cb('start') }]);
        return {
          sendMessage: {
            text: `📋 *Мои потоки*\n\nУ вас пока нет потоков\\.${LEGEND}`,
            parseMode: 'MarkdownV2',
            keyboard: { rows, isMultiple: false },
          },
        };
      }

      for (const s of myStreams as Array<{
        uuid: string;
        title: string;
        status: string;
      }>) {
        rows.push([
          {
            text: `${statusEmoji[s.status] ?? '❓'} ${s.title}`,
            code: this.cbFor('view-stream-mentor', 'view', s.uuid),
          },
        ]);
      }

      rows.push([{ text: '🔙 Назад', code: this.cb('start') }]);

      return {
        sendMessage: {
          text: `📋 *Мои потоки*${LEGEND}`,
          parseMode: 'MarkdownV2',
          keyboard: { rows, isMultiple: false },
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
