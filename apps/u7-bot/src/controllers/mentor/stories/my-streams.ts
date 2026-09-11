import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { md, mdJoin, mdRaw } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';

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

const LEGEND = mdRaw(
  '\n\n🟡 — идёт набор   🔵 — идёт обучение   🟢 — завершён   ⚫ — в архиве',
);

/**
 * Список потоков ментора с фильтрацией по статусу.
 * Доступен через подменю «Инструменты ментора».
 */
export class MyStreamsStory extends U7BotUiStory {
  readonly name = 'my-streams';

  async handleCallback(
    action: string,
    actor: User,
    _session: BotSession,
  ): Promise<DialogResponse> {
    // Парсим фильтры: list[:completed:1][:archived:1]
    const segments = action.split(':');
    const showCompleted = segments.includes('completed');
    const showArchived = segments.includes('archived');

    if (segments[0] !== 'list') {
      return this.unknownCommand(action, actor, _session);
    }

    return this.#handleList(actor, showCompleted, showArchived);
  }

  // ── Приватные методы ──

  async #handleList(
    actor: User,
    showCompleted: boolean,
    showArchived: boolean,
  ): Promise<DialogResponse> {
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
      const toggleRow: KbButton[] = [];
      if (!showArchived && !showCompleted) {
        toggleRow.push(
          this.btn('⚫ Вкл. архивированные', this.cb('list:archived:1')),
        );
        toggleRow.push(
          this.btn('🟢 Вкл. завершённые', this.cb('list:completed:1')),
        );
      } else if (showArchived && !showCompleted) {
        toggleRow.push(
          this.btn(
            '🟢 Вкл. завершённые',
            this.cb('list:completed:1:archived:1'),
          ),
        );
      } else if (!showArchived && showCompleted) {
        toggleRow.push(
          this.btn(
            '⚫ Вкл. архивированные',
            this.cb('list:completed:1:archived:1'),
          ),
        );
      }
      // Если оба включены — переключателей нет

      const rows: KbButton[][] = [];
      if (toggleRow.length > 0) {
        rows.push(toggleRow);
      }

      if (myStreams.length === 0) {
        rows.push([this.btn('🔙 Назад', this.cbFor('submenu', 'start'))]);
        return this.screen(
          mdJoin([
            md`📋 *Мои потоки*`,
            md``,
            md`У вас пока нет потоков\\.`,
            LEGEND,
          ]),
          this.kb(rows),
        );
      }

      // Строки потоков
      for (const s of myStreams) {
        rows.push([
          this.btn(
            `${STATUS_EMOJI[s.status] ?? '❓'} ${s.title}`,
            this.cbFor('view-stream-mentor', 'view', s.uuid),
          ),
        ]);
      }

      rows.push([this.btn('🔙 Назад', this.cbFor('submenu', 'start'))]);

      return this.screen(mdJoin([md`📋 *Мои потоки*`, LEGEND]), this.kb(rows));
    } catch {
      return this.screen(md`⚠️ Не удалось загрузить список потоков\\.`);
    }
  }
}
