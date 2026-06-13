import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { BotUserStory } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';

/**
 * US-7: Запуск потока (старт обучения).
 * Ментор активирует поток — студенты получают первый шаг.
 */
export class ActivateStreamStory extends BotUserStory<StreamAppMeta> {
  readonly name = 'activate-stream';

  async handleCallback(
    action: string,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    const parts = action.split(':');
    if (parts[0] !== 'activate' || !parts[1]) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const streamId = parts[1]!;
    await this.api.execute('activate-stream', { streamId });

    return {
      sendMessage: {
        text: '🚀 *Поток запущен!* Студенты получили первые задания.',
        parseMode: 'MarkdownV2',
      },
    };
  }

  async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  async handleStart(): Promise<null> {
    return null;
  }
}
