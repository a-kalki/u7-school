import type { User } from '@u7-scl/app/domain';
import type {
  BotResponse,
  KeyboardDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type { Stream } from '../../../domain/stream/entity';
import { StreamPolicy } from '../../../domain/stream/policy';
import { ViewStreamStory } from './view-stream.story';

/**
 * US-2m: Менторский режим карточки потока (S02m).
 *
 * Показывает ту же карточку, что S02 (curious), но с lifecycle-кнопками.
 * Наследует ViewStreamStory, переопределяет buildKeyboard.
 *
 * Запуск — через «🛠️ Инструменты ментора» → «📋 Мои потоки».
 */
export class ViewStreamMentorStory extends ViewStreamStory {
  override readonly name: string = 'view-stream-mentor';
  protected override storyName: string = 'view-stream-mentor';

  override async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');

    // Делегируем просмотр карточки, программы и деталей родителю
    if (cmd === 'view' && streamId) {
      return this.handleView(streamId, actor);
    }

    if (cmd === 'program' && streamId) {
      return this.handleProgramView(streamId);
    }

    if (cmd === 'details' && streamId) {
      return this.handleDetailsView(streamId);
    }

    // Lifecycle-действия
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

  // ── Переопределение клавиатуры ──

  protected override buildKeyboard(
    stream: Stream,
    actor: User,
  ): KeyboardDescription {
    const canEdit = StreamPolicy.canEdit(actor, stream);
    const rows: Array<Array<{ text: string; code: string }>> = [];

    // ── Публичные кнопки (всем) ──
    rows.push([
      {
        text: '📖 Программа курса',
        code: this.cbFor('view-stream-mentor', 'program', stream.uuid),
      },
    ]);

    rows.push([
      {
        text: '👥 Студенты',
        code: this.cbFor('monitor', 'students', stream.uuid),
      },
    ]);

    rows.push([
      {
        text: '📋 Детали',
        code: this.cbFor('view-stream-mentor', 'details', stream.uuid),
      },
    ]);

    // ── Lifecycle-кнопки (только для владельца / ADMIN) ──
    if (canEdit) {
      const lifecycleRow: Array<{ text: string; code: string }> = [];

      if (stream.status === 'enrollment') {
        lifecycleRow.push({
          text: '🚀 Запустить',
          code: this.cbFor('activate-stream', 'activate', stream.uuid),
        });
      }

      if (stream.status === 'active') {
        lifecycleRow.push({
          text: '✅ Завершить',
          code: this.cbFor('view-stream-mentor', 'complete', stream.uuid),
        });
      }

      if (stream.status === 'completed') {
        lifecycleRow.push({
          text: '📁 В архив',
          code: this.cbFor('view-stream-mentor', 'archive', stream.uuid),
        });
      }

      if (lifecycleRow.length > 0) {
        rows.push(lifecycleRow);
      }
    }

    // Кнопка «Назад» — возврат к моим потокам (не в catalog)
    rows.push([
      {
        text: '⬅️ Назад к моим потокам',
        code: this.cbFor('mentor-tools', 'my-streams'),
      },
    ]);

    return { rows, isMultiple: false };
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
                code: this.cbFor('view-stream-mentor', 'view', streamId),
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
                code: this.cbFor('view-stream-mentor', 'view', streamId),
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
    await this.appApi.execute('complete-stream', { streamId }, actor.uuid);
    return {
      sendMessage: {
        text: '✅ *Поток завершён\\!* Обучение окончено\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⬅️ Назад к списку',
                code: this.cbFor('mentor-tools', 'my-streams'),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #handleArchive(streamId: string, actor: User): Promise<BotResponse> {
    await this.appApi.execute('archive-stream', { streamId }, actor.uuid);
    return {
      sendMessage: {
        text: '📁 *Поток перемещён в архив\\.*',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⬅️ Назад к списку',
                code: this.cbFor('mentor-tools', 'my-streams'),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }
}
