import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US-3: Запись на поток (Регистрация).
 * Выполняет enroll-student, показывает результат с датой старта и делегирует на learning.
 */
export class EnrollStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'enroll';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');
    if (cmd !== 'enroll' || !streamId) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    // Получаем поток для названия, даты старта и ссылки на чат
    const stream = await this.moduleApi.execute('get-stream', { streamId });

    await this.moduleApi.execute('enroll-student', {
      streamId,
      userId: actor.uuid,
    });

    const dateStr = this.formatDate(stream.startDate);

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

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }
}
