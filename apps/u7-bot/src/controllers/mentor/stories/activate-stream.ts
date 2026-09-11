import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { md } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';

/**
 * US-7: Запуск потока (старт обучения).
 * Ментор активирует поток — студенты получают первый шаг.
 */
export class ActivateStreamStory extends U7BotUiStory {
  readonly name = 'activate-stream';

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, streamId] = action.split(':');
    if (cmd !== 'activate' || !streamId) {
      return this.unknownCommand(action, actor, session);
    }
    await this.appApi.execute('activate-stream', { streamId }, actor.uuid);

    return {
      screen: {
        text: md`🚀 *Поток запущен\\!* Первые задания выданы студентам\\. Они увидят их в разделе «🎓 Моя учёба»\\.`,
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
}
