import type { User } from '@u7-scl/app/domain';
import type {
  BotResponse,
  KeyboardDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type { Stream } from '@u7-scl/stream/domain';
import { StreamPolicy, StudentPolicy } from '@u7-scl/stream/domain';
import { ViewStreamStory } from '../../streams/stories/view-stream.story';

/**
 * S02m: Менторский режим карточки потока.
 *
 * Наследует ViewStreamStory, переопределяет buildKeyboard
 * для добавления lifecycle-кнопок (🚀 Запустить, ✅ Завершить, 📁 В архив).
 *
 * Запуск — через «🛠️ Инструменты ментора» → «📋 Мои потоки».
 */
export class ViewStreamMentorStory extends ViewStreamStory {
  override readonly name: string = 'view-stream-mentor';
  protected override storyName = 'view-stream-mentor';

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

    // Всё остальное (включая students, enroll, cancel) — делегируем родителю
    return super.handleCallback(action, actor, _session);
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
        code: this.cbFor('my-streams', 'list'),
      },
    ]);

    return { rows, isMultiple: false };
  }

  /**
   * Менторский режим списка студентов.
   * Переопределяет родительский: кнопка студента → monitor:detail,
   * + кнопки управления статусом (⛔✅🔄).
   */
  protected override async handleStudentsList(
    streamId: string,
    actor: User,
  ): Promise<BotResponse> {
    // Получаем базовый ответ от родителя (текст, статистика, форматирование)
    const baseResponse = await super.handleStudentsList(streamId, actor);
    const baseText = baseResponse.sendMessage?.text ?? '';
    const baseKeyboard = baseResponse.sendMessage?.keyboard;
    if (!baseKeyboard) return baseResponse;

    // Получаем данные для построения менторской клавиатуры
    const students = (await this.appApi.execute(
      'list-stream-students',
      { streamId },
      actor.uuid,
    )) as Array<{ uuid: string; userId: string; status: string }>;

    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as Stream;

    const canManage = StudentPolicy.canManageStudent(actor, stream);

    // Перестраиваем клавиатуру: заменяем коды кнопок на monitor:...
    const newRows = baseKeyboard.rows.map((row) => {
      return row.map((btn) => {
        // Заменяем student-detail на monitor:detail
        if (btn.code.includes(':student-detail:')) {
          const parts = btn.code.split(':');
          const studentUuid = parts[parts.length - 1];
          return {
            text: btn.text,
            code: this.cbFor('monitor', 'detail', studentUuid!),
          };
        }
        // Кнопку «Назад к потоку» оставляем как есть (view-stream-mentor:view:...)
        return btn;
      });
    });

    // Добавляем менторские кнопки (⛔✅🔄) для управляемых студентов
    const enrichedRows = newRows.map((row, rowIdx) => {
      // Последняя строка — «Назад» — не трогаем
      if (rowIdx === newRows.length - 1) return row;

      const studentBtn = row[0];
      if (!studentBtn) return row;

      // Извлекаем studentUuid из кода кнопки
      const parts = studentBtn.code.split(':');
      const studentUuid = parts[parts.length - 1];
      const student = students.find((s) => s.uuid === studentUuid);
      if (!student || !canManage) return row;

      const isActive =
        student.status === 'active' || student.status === 'enrolled';
      const extraBtns: Array<{ text: string; code: string }> = [];

      if (isActive) {
        extraBtns.push({
          text: '⛔',
          code: this.cbFor('monitor', 'mark-abandoned', studentUuid!),
        });
        extraBtns.push({
          text: '✅',
          code: this.cbFor('monitor', 'complete', studentUuid!),
        });
      } else if (
        student.status === 'advanced' ||
        student.status === 'not_advanced'
      ) {
        extraBtns.push({
          text: '🔄',
          code: this.cbFor('monitor', 'complete', studentUuid!),
        });
      }

      return [...row, ...extraBtns];
    });

    return {
      sendMessage: {
        text: baseText,
        parseMode: 'MarkdownV2',
        keyboard: { rows: enrichedRows, isMultiple: false },
      },
    };
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
                code: this.cbFor('my-streams', 'list'),
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
                code: this.cbFor('my-streams', 'list'),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }
}
