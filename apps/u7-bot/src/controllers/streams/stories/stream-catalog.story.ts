import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { type MdText, md, mdConcat } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';
import { StreamStatus } from '@u7-scl/stream/domain';
import { buttons } from '../../shared/buttons';

/** Витрина потока каталога — минимум полей для отображения */
interface StreamRow {
  uuid: string;
  title: string;
  status: string;
}

const STATUS_EMOJI: Record<string, string> = {
  enrollment: '🟡',
  active: '🔵',
  completed: '🟢',
  archived: '⚫',
};

const LEGEND = md`\n\n🟡 — идёт набор   🔵 — идёт обучение   🟢 — завершён   ⚫ — в архиве`;

/**
 * S01: Просмотр витрины потоков (Каталог).
 * Показывает список активных потоков и потоков с открытым набором.
 * Кнопки потоков — мосты в view-stream (валидный штамп).
 */
export class CatalogStory extends U7BotUiStory {
  readonly name = 'catalog';

  override menuButtons(_actor: User): MenuButton[] {
    return [
      {
        kind: 'callback',
        text: '📚 Потоки курсов',
        action: this.cb('list'),
        priority: 15,
        description:
          '📚 Потоки курсов — просмотр каталога учебных потоков школы',
      },
    ];
  }

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const showCompleted =
      action === 'list-with-completed' || action === 'list-with-all';
    const showArchived = action === 'list-with-all';
    if (action !== 'list' && !showCompleted) {
      return this.unknownCommand(action, actor, session);
    }

    // Получаем все потоки одним запросом (без фильтра по статусу)
    const allStreams = (await this.appApi.execute(
      'list-streams',
      {},
    )) as StreamRow[];

    // Разделяем по статусам
    const enrollmentStreams = allStreams.filter(
      (s) => s.status === StreamStatus.ENROLLMENT,
    );
    const activeStreams = allStreams.filter(
      (s) => s.status === StreamStatus.ACTIVE,
    );
    const completedStreams = allStreams.filter(
      (s) => s.status === StreamStatus.COMPLETED,
    );
    const archivedStreams = allStreams.filter(
      (s) => s.status === StreamStatus.ARCHIVED,
    );

    const hasCompleted = completedStreams.length > 0;
    const hasArchived = archivedStreams.length > 0;

    // Формируем список для показа
    const visible = [...enrollmentStreams, ...activeStreams];
    if (showCompleted) {
      visible.push(...completedStreams);
    }
    if (showArchived) {
      visible.push(...archivedStreams);
    }

    // Нет потоков для показа
    if (visible.length === 0) {
      const toggleRows: KbButton[][] = [];
      if (hasCompleted && !showCompleted) {
        toggleRows.push([
          this.btn('🟢 Вкл. завершённые', this.cb('list-with-completed')),
        ]);
      }
      if (hasArchived && !showArchived) {
        toggleRows.push([
          this.btn('⚫ Вкл. архивированные', this.cb('list-with-all')),
        ]);
      }
      if (toggleRows.length > 0) {
        toggleRows.push([this.#mainMenuButton()]);
        return this.screen(md`📚 *Нет активных потоков*`, this.kb(toggleRows));
      }

      return this.screen(md`📚 Нет доступных потоков`);
    }

    // Кросс-стори колбэки: ссылаемся на ViewStreamStory
    const rows: KbButton[][] = visible.map((s) => [
      this.btn(
        `${STATUS_EMOJI[s.status] ?? '❓'} ${s.title}`,
        this.cbFor('view-stream', 'view', s.uuid),
      ),
    ]);

    // Кнопки-переключатели
    const toggles: KbButton[] = [];
    if (hasCompleted && !showCompleted) {
      toggles.push(
        this.btn('🟢 Вкл. завершённые', this.cb('list-with-completed')),
      );
    }
    if (hasArchived && !showArchived) {
      toggles.push(
        this.btn('⚫ Вкл. архивированные', this.cb('list-with-all')),
      );
    }
    if (showCompleted && !showArchived && hasArchived) {
      toggles.push(
        this.btn('⚫ Вкл. архивированные', this.cb('list-with-all')),
      );
    }
    if ((showCompleted || showArchived) && toggles.length === 0) {
      toggles.push(this.btn('🔵 Только активные', this.cb('list')));
    }
    if (toggles.length > 0) {
      rows.push(toggles);
    }

    // Кнопка «↩️ Главное меню» последней строкой
    rows.push([this.#mainMenuButton()]);

    return this.screen(this.#catalogTitle(), this.kb(rows));
  }

  /** Заголовок каталога с легендой статусов. */
  #catalogTitle(): MdText {
    return mdConcat(md`📚 *Потоки курсов*`, LEGEND);
  }

  /** Кнопка «↩️ Главное меню» — мост на системный код приложения. */
  #mainMenuButton(): { text: string; code: string } {
    return buttons.mainMenu();
  }
}
