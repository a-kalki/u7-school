import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { BotUserStory } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';

/** Упрощённый интерфейс актора для проверки ролей */
interface Actor {
  uuid: string;
  roles: string[];
}

/**
 * US-3: Запись на поток (Регистрация).
 * Выполняет enroll-student, показывает результат и делегирует на learning.
 */
export class EnrollStory extends BotUserStory<StreamAppMeta> {
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
    const a = actor as Actor;

    // Получаем поток для ссылки на чат
    const stream = (await this.api.execute('get-stream', {
      streamId,
    })) as unknown as {
      title: string;
      telegramGroupId?: string;
      telegramGroupInvite?: string;
    };

    await this.api.execute('enroll-student', { streamId, userId: a.uuid });

    const lines = ['🎉 *Вы успешно записаны на поток!*', ''];
    if (stream?.title) {
      lines.push(`📋 _${this.escapeMarkdown(stream.title)}_`);
    }
    if (stream?.telegramGroupInvite) {
      lines.push('');
      lines.push(`🔗 ${this.escapeMarkdown(stream.telegramGroupInvite)}`);
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

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
