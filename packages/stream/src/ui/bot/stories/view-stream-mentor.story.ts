import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US-2m: Менторские lifecycle-операции над потоком.
 *
 * ⚠️ НЕ активирован. Перенесён из ViewStreamStory в трек mentor_tools_20260713.
 *
 * При активации:
 * 1. Снять `describe.skip` в тестах
 * 2. Зарегистрировать в MentorController (трек mentor_tools_20260713)
 *
 * Содержит: завершение потока, архивирование, confirm-диалоги.
 */
export class ViewStreamMentorStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'view-stream-mentor';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');

    if (cmd === 'complete-confirm' && streamId) {
      return this.#handleComplete(streamId, actor);
    }

    if (cmd === 'complete' && streamId) {
      return this.#showCompleteConfirm(streamId);
    }

    if (cmd === 'archive-confirm' && streamId) {
      return this.#handleArchive(streamId, actor);
    }

    if (cmd === 'archive' && streamId) {
      return this.#showArchiveConfirm(streamId);
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }

  // ── Подтверждения ──

  #showCompleteConfirm(streamId: string): BotResponse {
    return {
      sendMessage: {
        text: '⚠️ *Завершить поток?*\n\nЭто действие остановит обучение для всех студентов\\. Поток нельзя будет перезапустить\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '✅ Да, завершить',
                code: this.cbFor(
                  'view-stream-mentor',
                  'complete-confirm',
                  streamId,
                ),
              },
              {
                text: '❌ Отмена',
                code: this.cbFor('view-stream', 'view', streamId),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  #showArchiveConfirm(streamId: string): BotResponse {
    return {
      sendMessage: {
        text: '⚠️ *Отправить поток в архив?*\n\nПоток будет скрыт из витрины\\. Студенты потеряют доступ к обучению\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '✅ Да, в архив',
                code: this.cbFor(
                  'view-stream-mentor',
                  'archive-confirm',
                  streamId,
                ),
              },
              {
                text: '❌ Отмена',
                code: this.cbFor('view-stream', 'view', streamId),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  // ── Менторские действия ──

  async #handleComplete(streamId: string, actor: User): Promise<BotResponse> {
    await this.moduleApi.execute(
      'complete-stream',
      { streamId },
      actor.uuid,
    );
    return {
      sendMessage: {
        text: '✅ *Поток завершён\\!* Обучение окончено\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [[{ text: '⬅️ Назад к списку', code: 'catalog:list' }]],
          isMultiple: false,
        },
      },
    };
  }

  async #handleArchive(streamId: string, actor: User): Promise<BotResponse> {
    await this.moduleApi.execute(
      'archive-stream',
      { streamId },
      actor.uuid,
    );
    return {
      sendMessage: {
        text: '📁 *Поток перемещён в архив\\.*',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [[{ text: '⬅️ Назад к списку', code: 'catalog:list' }]],
          isMultiple: false,
        },
      },
    };
  }
}
