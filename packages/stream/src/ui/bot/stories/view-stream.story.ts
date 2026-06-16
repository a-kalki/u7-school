import type {
  BotResponse,
  KeyboardDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';
import { U7BotUserStory } from '@u7-scl/app/ui';

interface StreamDetail {
  uuid: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  goal?: string;
  result?: string;
  rules?: string;
  additional?: string;
  targetAudience?: string;
  telegramGroupId?: string;
  telegramGroupInvite?: string;
}

/**
 * US-2: Детальная карточка потока.
 * Показывает описание, статус, дату старта, количество студентов.
 */
export class ViewStreamStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'view-stream';

  async handleCallback(
    action: string,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    const parts = action.split(':');
    if (parts[0] !== 'view' || !parts[1]) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const streamId = parts[1]!;

    const stream = (await this.moduleApi.execute('get-stream', {
      streamId,
    })) as unknown as StreamDetail;

    const students = (await this.moduleApi.execute('list-stream-students', {
      streamId,
    })) as unknown as Array<{ uuid: string }>;

    const statusLabels: Record<string, string> = {
      enrollment: '🟢 Набор открыт',
      active: '🔵 Идёт обучение',
      completed: '⚪ Завершён',
      archived: '⚪ Архивирован',
    };

    const dateStr = this.#formatDate(stream.startDate);

    const lines = [
      `📋 *${this.escapeMarkdown(stream.title)}*`,
      '',
      `_${this.escapeMarkdown(stream.description)}_`,
      '',
      `📅 Старт: ${this.escapeMarkdown(dateStr)}`,
      `👥 Студентов: ${students.length}`,
      `📌 Статус: ${statusLabels[stream.status] ?? stream.status}`,
    ];

    if (stream.telegramGroupInvite) {
      lines.push('', `🔗 ${this.escapeMarkdown(stream.telegramGroupInvite)}`);
    }

    const text = lines.join('\n');

    // Кнопка «Записаться» только для enrollment
    const keyboard: KeyboardDescription | undefined =
      stream.status === 'enrollment'
        ? {
            rows: [
              [
                {
                  text: '📝 Записаться',
                  code: `enroll:enroll:${streamId}`,
                },
              ],
            ],
            isMultiple: false,
          }
        : undefined;

    return {
      sendMessage: {
        text,
        parseMode: 'MarkdownV2',
        keyboard,
      },
    };
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: unknown): Promise<null> {
    return null;
  }

  #formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return iso;
    }
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
