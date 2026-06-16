import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { BotUserStory } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';

interface StreamItem {
  uuid: string;
  title: string;
  status: string;
}

/**
 * US-1: Просмотр витрины потоков (Каталог).
 * Показывает список активных потоков и потоков с открытым набором.
 */
export class CatalogStory extends BotUserStory<StreamAppMeta> {
  readonly name = 'catalog';

  async handleCallback(
    action: string,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    if (action !== 'list') {
      return { sendMessage: { text: '⚠️ Неизвестная команда каталога' } };
    }

    const streams = (await this.moduleApi.execute(
      'list-streams',
      {},
    )) as unknown as StreamItem[];

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
        text: `${statusEmoji[s.status] ?? '❓'} ${this.escapeMarkdown(s.title)}`,
        code: `view-stream:view:${s.uuid}`,
      },
    ]);

    return {
      sendMessage: {
        text: '📚 *Потоки школы*',
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: unknown): Promise<MainMenuAction | null> {
    return {
      text: '📚 Наши потоки',
      action: this.cb('list'),
      priority: 10,
    };
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
