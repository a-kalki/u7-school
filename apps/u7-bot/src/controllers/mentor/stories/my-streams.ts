import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';

interface StreamRow {
  uuid: string;
  title: string;
  status: string;
  mentorId: string;
}

const STATUS_EMOJI: Record<string, string> = {
  enrollment: '🟡',
  active: '🔵',
  completed: '🟢',
  archived: '⚫',
};

const LEGEND =
  '\n\n🟡 — идёт набор   🔵 — идёт обучение   🟢 — завершён   ⚫ — в архиве';

/**
 * Список потоков ментора с фильтрацией по статусу.
 * Доступен через подменю «Инструменты ментора».
 */
export class MyStreamsStory extends U7BotUserStory {
  readonly name = 'my-streams';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    // Парсим фильтры: list[:completed:1][:archived:1]
    const segments = action.split(':');
    const showCompleted = segments.includes('completed');
    const showArchived = segments.includes('archived');

    if (segments[0] !== 'list') {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    return this.#handleList(actor, showCompleted, showArchived);
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

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }

  // ── Приватные методы ──

  async #handleList(
    actor: User,
    showCompleted: boolean,
    showArchived: boolean,
  ): Promise<BotResponse> {
    try {
      const allStreams = (await this.appApi.execute('list-streams', {})) as
        | StreamRow[]
        | undefined;

      // Только потоки текущего ментора
      let myStreams = (allStreams ?? []).filter(
        (s) => s.mentorId === actor.uuid,
      );

      // Фильтрация по умолчанию — только enrollment + active
      if (!showArchived && !showCompleted) {
        myStreams = myStreams.filter(
          (s) => s.status === 'enrollment' || s.status === 'active',
        );
      } else {
        myStreams = myStreams.filter((s) => {
          if (s.status === 'archived') return showArchived;
          if (s.status === 'completed') return showCompleted;
          return true; // enrollment, active — всегда видно
        });
      }

      // Кнопки-переключатели
      const toggleRow: Array<{ text: string; code: string }> = [];
      if (!showArchived && !showCompleted) {
        toggleRow.push({
          text: '⚫ Вкл. архивированные',
          code: this.cb('list:archived:1'),
        });
        toggleRow.push({
          text: '🟢 Вкл. завершённые',
          code: this.cb('list:completed:1'),
        });
      } else if (showArchived && !showCompleted) {
        toggleRow.push({
          text: '🟢 Вкл. завершённые',
          code: this.cb('list:completed:1:archived:1'),
        });
      } else if (!showArchived && showCompleted) {
        toggleRow.push({
          text: '⚫ Вкл. архивированные',
          code: this.cb('list:completed:1:archived:1'),
        });
      }
      // Если оба включены — переключателей нет

      const rows: Array<Array<{ text: string; code: string }>> = [];
      if (toggleRow.length > 0) {
        rows.push(toggleRow);
      }

      if (myStreams.length === 0) {
        rows.push([
          {
            text: '🔙 Назад',
            code: this.cbFor('submenu', 'start'),
          },
        ]);
        return {
          sendMessage: {
            text: `📋 *Мои потоки*\n\nУ вас пока нет потоков\\.${LEGEND}`,
            parseMode: 'MarkdownV2',
            keyboard: { rows, isMultiple: false },
          },
        };
      }

      // Строки потоков
      for (const s of myStreams) {
        rows.push([
          {
            text: `${STATUS_EMOJI[s.status] ?? '❓'} ${s.title}`,
            code: this.cbFor('view-stream-mentor', 'view', s.uuid),
          },
        ]);
      }

      rows.push([
        {
          text: '🔙 Назад',
          code: this.cbFor('submenu', 'start'),
        },
      ]);

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
