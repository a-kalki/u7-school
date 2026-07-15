import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US-7: Запуск потока (старт обучения).
 * Ментор активирует поток — студенты получают первый шаг.
 */
export class ActivateStreamStory extends U7BotUserStory<StreamApiModuleMeta> {
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
    await this.moduleApi.execute('activate-stream', { streamId }, actor.uuid);

    return {
      sendMessage: {
        text: '🚀 *Поток запущен\\!* Первые задания выданы студентам\\. Они увидят их в разделе «🎓 Моя учёба»\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⬅️ Назад к потоку',
                code: `view-stream:view:${streamId}`,
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
