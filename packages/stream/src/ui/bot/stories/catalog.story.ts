import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';
import { StreamStatus } from '../../../domain/status';

/**
 * US-1: Просмотр витрины потоков (Каталог).
 * Показывает список активных потоков и потоков с открытым набором.
 */
export class CatalogStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'catalog';

  async handleCallback(
    action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const showCompleted = action === 'list-with-completed';
    if (action !== 'list' && !showCompleted) {
      return { sendMessage: { text: '⚠️ Неизвестная команда каталога' } };
    }

    // Получаем все потоки одним запросом (без фильтра по статусу)
    const allStreams = await this.moduleApi.execute('list-streams', {});

    // Разделяем по статусам, archived не показываем никогда
    const enrollmentStreams = allStreams.filter(
      (s) => s.status === StreamStatus.ENROLLMENT,
    );
    const activeStreams = allStreams.filter(
      (s) => s.status === StreamStatus.ACTIVE,
    );
    const completedStreams = allStreams.filter(
      (s) => s.status === StreamStatus.COMPLETED,
    );

    const hasCompleted = completedStreams.length > 0;

    // Формируем список для показа
    const visible = [...enrollmentStreams, ...activeStreams];
    if (showCompleted) {
      visible.push(...completedStreams);
    }

    // Нет потоков для показа
    if (visible.length === 0) {
      // Если есть завершённые, но они скрыты — показываем кнопку переключения
      if (hasCompleted && !showCompleted) {
        return {
          sendMessage: {
            text: '📚 *Нет активных потоков*',
            parseMode: 'MarkdownV2',
            keyboard: {
              rows: [
                [
                  {
                    text: '🔍 Включить завершённые',
                    code: this.cb('list-with-completed'),
                  },
                ],
                [{ text: '↩️ Главное меню', code: 'app:main-menu' }],
              ],
              isMultiple: false,
            },
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
      enrollment: '🟢',
      active: '🔵',
      completed: '⚪',
      archived: '⚪',
    };

    // Кросс-стори колбэки: ссылаемся на ViewStreamStory
    const rows = visible.map((s) => [
      {
        text: `${statusEmoji[s.status] ?? '❓'} ${s.title}`,
        code: this.cbFor('view-stream', 'view', s.uuid),
      },
    ]);

    const legend = '\n\n🟢 — идёт набор   🔵 — идёт обучение   ⚪ — завершён';

    // Кнопка-переключатель завершённых потоков
    if (hasCompleted && !showCompleted) {
      rows.push([
        {
          text: '🔍 Включить завершённые',
          code: this.cb('list-with-completed'),
        },
      ]);
    } else if (showCompleted) {
      rows.push([
        {
          text: '🔍 Скрыть завершённые',
          code: this.cb('list'),
        },
      ]);
    }

    // Кнопка «↩️ Главное меню» последней строкой
    rows.push([{ text: '↩️ Главное меню', code: 'app:main-menu' }]);

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
}
