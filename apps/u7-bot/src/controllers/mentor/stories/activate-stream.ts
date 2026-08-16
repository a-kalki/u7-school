import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';

/**
 * US-7: Запуск потока (старт обучения).
 * Ментор активирует поток — студенты получают первый шаг.
 */
export class ActivateStreamStory extends U7BotUiStory {
  readonly name = 'activate-stream';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');
    if (cmd !== 'activate' || !streamId) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }
    await this.appApi.execute('activate-stream', { streamId }, actor.uuid);

    return {
      sendMessage: {
        text: '🚀 *Поток запущен\\!* Первые задания выданы студентам\\. Они увидят их в разделе «🎓 Моя учёба»\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⬅️ Назад к потоку',
                code: this.cbFor('view-stream-mentor', 'view', streamId),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }
}
