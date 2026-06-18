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
    if (action !== 'list') {
      return { sendMessage: { text: '⚠️ Неизвестная команда каталога' } };
    }

    // Запрашиваем потоки со статусами enrollment и active
    const [enrollmentStreams, activeStreams] = await Promise.all([
      this.moduleApi.execute('list-streams', {
        status: StreamStatus.ENROLLMENT,
      }),
      this.moduleApi.execute('list-streams', {
        status: StreamStatus.ACTIVE,
      }),
    ]);

    // Объединяем и дедуплицируем по uuid
    const seen = new Set<string>();
    const streams: typeof enrollmentStreams = [];
    for (const s of [...enrollmentStreams, ...activeStreams]) {
      if (!seen.has(s.uuid)) {
        seen.add(s.uuid);
        streams.push(s);
      }
    }

    if (streams.length === 0) {
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
    const rows = streams.map((s) => [
      {
        text: `${statusEmoji[s.status] ?? '❓'} ${s.title}`,
        code: this.cbFor('view-stream', 'view', s.uuid),
      },
    ]);

    const legend = '\n\n🟢 — идёт набор   🔵 — идёт обучение   ⚪ — завершён';

    return {
      sendMessage: {
        text: `📚 *Потоки школы*${legend}`,
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
      text: '📚 Наши потоки',
      action: this.cb('list'),
      priority: 10,
    };
  }
}
