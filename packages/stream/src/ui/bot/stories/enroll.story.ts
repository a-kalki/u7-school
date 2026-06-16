import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { User } from '@u7-scl/app/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';
import { U7BotUserStory } from '@u7-scl/app/ui';

/**
 * US-3: Запись на поток (Регистрация).
 * Выполняет enroll-student, показывает результат с датой старта и делегирует на learning.
 */
export class EnrollStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'enroll';

  async handleCallback(
    action: string,
    actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    const parts = action.split(':');
    if (parts[0] !== 'enroll' || !parts[1]) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const streamId = parts[1]!;
    const a = actor as User;

    // Получаем поток для названия, даты старта и ссылки на чат
    const stream = await this.moduleApi.execute('get-stream', { streamId });

    await this.moduleApi.execute('enroll-student', {
      streamId,
      userId: a.uuid,
    });

    const dateStr = this.#formatDate(stream.startDate);

    const lines = [
      '🎉 *Вы успешно записаны на поток!*',
      '',
      `📋 _${this.escapeMarkdown(stream.title)}_`,
      `📅 Обучение начнётся: ${this.escapeMarkdown(dateStr)}`,
    ];

    if (stream.telegramGroupInvite) {
      lines.push('', `🔗 ${this.escapeMarkdown(stream.telegramGroupInvite)}`);
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
      },
      delegate: { path: 'learning:my-study' },
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
