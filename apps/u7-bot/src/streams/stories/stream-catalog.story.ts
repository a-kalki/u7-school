import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
  StoryPublicActions,
} from '@u7-scl/core/ui';
import { StreamStatus } from '@u7-scl/stream/domain';
import type { CommunityActions } from '../../app/stories/community.story';

/** Действия, публикуемые CatalogStory для кросс-ссылок из других контроллеров. */
export interface CatalogActions extends StoryPublicActions {
  /** Кнопка «📚 Потоки курсов» в главном меню. */
  list(): { text: string; code: string };
}

/**
 * S01: Просмотр витрины потоков (Каталог).
 * Показывает список активных потоков и потоков с открытым набором.
 */
export class CatalogStory extends U7BotUserStory {
  readonly name = 'catalog';

  /** Публичные действия для кросс-ссылок через uiApp.getAction. */
  override readonly publicActions: CatalogActions = {
    list: () => ({
      text: '📚 Потоки курсов',
      code: this.cb('list'),
    }),
  };

  async handleCallback(
    action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const showCompleted =
      action === 'list-with-completed' || action === 'list-with-all';
    const showArchived = action === 'list-with-all';
    if (action !== 'list' && !showCompleted) {
      return { sendMessage: { text: '⚠️ Неизвестная команда каталога' } };
    }

    // Получаем все потоки одним запросом (без фильтра по статусу)
    const allStreams = await this.appApi.execute('list-streams', {});

    // Разделяем по статусам
    const enrollmentStreams = allStreams.filter(
      (s: { status: string }) => s.status === StreamStatus.ENROLLMENT,
    );
    const activeStreams = allStreams.filter(
      (s: { status: string }) => s.status === StreamStatus.ACTIVE,
    );
    const completedStreams = allStreams.filter(
      (s: { status: string }) => s.status === StreamStatus.COMPLETED,
    );
    const archivedStreams = allStreams.filter(
      (s: { status: string }) => s.status === StreamStatus.ARCHIVED,
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
      const toggleRows: Array<Array<{ text: string; code: string }>> = [];
      if (hasCompleted && !showCompleted) {
        toggleRows.push([
          {
            text: '🟢 Вкл. завершённые',
            code: this.cb('list-with-completed'),
          },
        ]);
      }
      if (hasArchived && !showArchived) {
        toggleRows.push([
          {
            text: '⚫ Вкл. архивированные',
            code: this.cb('list-with-all'),
          },
        ]);
      }
      if (toggleRows.length > 0) {
        toggleRows.push([this.#getMainMenuButton()]);
        return {
          sendMessage: {
            text: '📚 *Нет активных потоков*',
            parseMode: 'MarkdownV2',
            keyboard: { rows: toggleRows, isMultiple: false },
          },
        };
      }

      return {
        sendMessage: {
          text: '📚 Нет доступных потоков',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const statusEmoji: Record<string, string> = {
      enrollment: '🟡',
      active: '🔵',
      completed: '🟢',
      archived: '⚫',
    };

    // Кросс-стори колбэки: ссылаемся на ViewStreamStory
    const rows: Array<Array<{ text: string; code: string }>> = visible.map(
      (s: { status: string; title: string; uuid: string }) => [
        {
          text: `${statusEmoji[s.status] ?? '❓'} ${s.title}`,
          code: this.cbFor('view-stream', 'view', s.uuid),
        },
      ],
    );

    const legend =
      '\n\n🟡 — идёт набор   🔵 — идёт обучение   🟢 — завершён   ⚫ — в архиве';

    // Кнопки-переключатели
    const toggles: Array<{ text: string; code: string }> = [];
    if (hasCompleted && !showCompleted) {
      toggles.push({
        text: '🟢 Вкл. завершённые',
        code: this.cb('list-with-completed'),
      });
    }
    if (hasArchived && !showArchived) {
      toggles.push({
        text: '⚫ Вкл. архивированные',
        code: this.cb('list-with-all'),
      });
    }
    if (showCompleted && !showArchived && hasArchived) {
      toggles.push({
        text: '⚫ Вкл. архивированные',
        code: this.cb('list-with-all'),
      });
    }
    if ((showCompleted || showArchived) && toggles.length === 0) {
      toggles.push({
        text: '🔵 Только активные',
        code: this.cb('list'),
      });
    }
    if (toggles.length > 0) {
      rows.push(toggles);
    }

    // Кнопка «↩️ Главное меню» последней строкой
    rows.push([this.#getMainMenuButton()]);

    return {
      sendMessage: {
        text: `📚 *Потоки курсов*${legend}`,
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: User): Promise<MainMenuAction | null> {
    return {
      kind: 'callback',
      text: '📚 Потоки курсов',
      action: this.cb('list'),
      priority: 15,
      description: '📚 Потоки курсов — просмотр каталога учебных потоков школы',
    };
  }

  /** Кнопка «↩️ Главное меню» через кросс-ссылку на CommunityStory. */
  #getMainMenuButton(): { text: string; code: string } {
    return this.uiApp.getAction<CommunityActions>('mainMenu')();
  }
}
