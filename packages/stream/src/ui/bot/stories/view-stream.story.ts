import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type {
  BotResponse,
  KeyboardDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';
import type { Stream } from '../../../domain/stream/entity';
import { StreamPolicy } from '../../../domain/stream/policy';

/**
 * US-2: Детальная карточка потока.
 * Показывает описание, статус, дату старта, имя ментора и ролевые кнопки.
 */
export class ViewStreamStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'view-stream';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');

    // Показ программы курса
    if (cmd === 'program' && streamId) {
      return this.#handleProgram(streamId);
    }

    // Подтверждение завершения потока (ментор)
    if (cmd === 'complete-confirm' && streamId) {
      return this.#handleComplete(streamId, actor);
    }

    // Завершение потока — запрос подтверждения (ментор)
    if (cmd === 'complete' && streamId) {
      return this.#showCompleteConfirm(streamId);
    }

    // Подтверждение архивирования потока (ментор)
    if (cmd === 'archive-confirm' && streamId) {
      return this.#handleArchive(streamId, actor);
    }

    // Детали потока
    if (cmd === 'details' && streamId) {
      return this.#handleDetails(streamId);
    }

    // Архивирование потока — запрос подтверждения (ментор)
    if (cmd === 'archive' && streamId) {
      return this.#showArchiveConfirm(streamId);
    }

    if (cmd !== 'view' || !streamId) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    return this.#handleView(streamId, actor);
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }

  // ── Приватные методы ──

  async #handleView(streamId: string, actor: User): Promise<BotResponse> {
    const stream = await this.moduleApi.execute('get-stream', { streamId });
    let studentCount = 0;
    try {
      const students = await this.moduleApi.execute(
        'list-stream-students',
        {
          streamId,
        },
        actor.uuid,
      );
      studentCount = students.length;
    } catch (err) {
      this.handleError(err);
      // Для не-менторов список студентов недоступен — показываем 0
    }

    // Получаем имя ментора через appApi (модуль user)
    let mentorName = '';
    try {
      const mentor = await this.appApi.execute('get-user', {
        uuid: stream.mentorId,
      });
      mentorName = mentor.name;
    } catch (err) {
      this.handleError(err);
      // Ментор не найден — оставляем имя пустым
    }

    const statusLabels: Record<string, string> = {
      enrollment: '🟢 Набор открыт',
      active: '🔵 Идёт обучение',
      completed: '⚪ Завершён',
      archived: '⚪ Архивирован',
    };

    const dateStr = this.formatDate(stream.startDate);
    const timeStr = this.#formatTime(stream.startDate);

    const lines = [
      `📋 *${this.escapeMarkdown(stream.title)}*`,
      '',
      `_${this.escapeMarkdown(stream.description)}_`,
      '',
      `👤 Ментор: ${this.escapeMarkdown(mentorName)}`,
      `📅 Старт: ${this.escapeMarkdown(dateStr)}`,
      `🕐 Время: ${this.escapeMarkdown(timeStr)}`,
      `👥 Студентов: ${studentCount}`,
      `📌 Статус: ${statusLabels[stream.status] ?? stream.status}`,
    ];

    const text = lines.join('\n');
    const keyboard = this.#buildKeyboard(stream, actor);

    return {
      sendMessage: {
        text,
        parseMode: 'MarkdownV2',
        keyboard: keyboard.rows.length > 0 ? keyboard : undefined,
      },
    };
  }

  async #handleProgram(streamId: string): Promise<BotResponse> {
    const stream = await this.moduleApi.execute('get-stream', { streamId });
    const snapshot = stream.contentSnapshot;

    if (!snapshot || snapshot.length === 0) {
      return {
        sendMessage: {
          text: '📖 *Программа курса*\n\nПрограмма пока не загружена\\.',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [
              [
                {
                  text: '⬅️ Назад к потоку',
                  code: this.cbFor('view-stream', 'view', streamId),
                },
              ],
            ],
            isMultiple: false,
          },
        },
      };
    }

    const lines: string[] = ['📖 *Программа курса*', ''];

    for (const project of snapshot) {
      lines.push(`📁 ${this.escapeMarkdown(project.projectTitle)}`);
      for (const lesson of project.lessons) {
        lines.push(`  📝 ${this.escapeMarkdown(lesson.lessonTitle)}`);
      }
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⬅️ Назад к потоку',
                code: this.cbFor('view-stream', 'view', streamId),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #handleDetails(streamId: string): Promise<BotResponse> {
    const stream = await this.moduleApi.execute('get-stream', { streamId });

    const fields: Array<{ label: string; value: string | undefined }> = [
      { label: '🎯 Цель', value: stream.goal },
      { label: '🏆 Результат', value: stream.result },
      { label: '📜 Правила', value: stream.rules },
      { label: '👤 Целевая аудитория', value: stream.targetAudience },
      { label: '📝 Дополнительно', value: stream.additional },
    ];

    const filled = fields.filter((f) => f.value);

    const lines: string[] = [
      `📋 *Детали: ${this.escapeMarkdown(stream.title)}*`,
      '',
    ];

    if (filled.length > 0) {
      for (const f of filled) {
        lines.push(`${f.label}: ${this.escapeMarkdown(f.value ?? '')}`);
      }
    } else {
      lines.push('_Расширенная информация пока не добавлена\\._');
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⬅️ Назад к потоку',
                code: this.cbFor('view-stream', 'view', streamId),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  #buildKeyboard(stream: Stream, actor: User): KeyboardDescription {
    const canEnroll = StreamPolicy.canEnroll(actor);
    const isOwnerMentor = StreamPolicy.canEdit(actor, stream);
    const rows: Array<Array<{ text: string; code: string }>> = [];

    // ── Менторские кнопки (только владелец потока с ролью MENTOR) ──
    if (isOwnerMentor) {
      if (stream.status === 'enrollment') {
        rows.push([
          {
            text: '🚀 Запустить',
            code: this.cbFor('activate-stream', 'activate', stream.uuid),
          },
        ]);
      }

      if (stream.status === 'active') {
        rows.push([
          {
            text: '✅ Завершить',
            code: this.cbFor('view-stream', 'complete', stream.uuid),
          },
        ]);
      }

      rows.push([
        {
          text: '📁 В архив',
          code: this.cbFor('view-stream', 'archive', stream.uuid),
        },
      ]);
    }

    // ── Публичные кнопки (всем) ──
    rows.push([
      {
        text: '👥 Студенты',
        code: this.cbFor('monitor', 'students', stream.uuid),
      },
    ]);

    rows.push([
      {
        text: '📋 Детали',
        code: this.cbFor('view-stream', 'details', stream.uuid),
      },
    ]);

    // ── Гостевые кнопки ──
    if (!isOwnerMentor) {
      // Кнопка «Записаться» только для GUEST/CANDIDATE на enrollment
      if (stream.status === 'enrollment' && canEnroll) {
        rows.push([
          {
            text: '📝 Записаться',
            code: this.cbFor('enroll', 'enroll', stream.uuid),
          },
        ]);
      }

      // Кнопка «Программа курса» для всех на enrollment
      if (stream.status === 'enrollment') {
        rows.push([
          {
            text: '📖 Программа курса',
            code: this.cbFor('view-stream', 'program', stream.uuid),
          },
        ]);
      }

      // Кнопка «Уведомить о наборе» для GUEST/CANDIDATE на active
      if (stream.status === 'active' && canEnroll) {
        rows.push([
          {
            text: '🔔 Уведомить о наборе',
            code: this.cbFor('view-stream', 'notify', stream.uuid),
          },
        ]);
      }
    }

    // Кнопка «Назад к списку» всегда
    rows.push([
      {
        text: '⬅️ Назад к списку',
        code: this.cbFor('catalog', 'list'),
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
                code: this.cbFor('view-stream', 'complete-confirm', streamId),
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
                code: this.cbFor('view-stream', 'archive-confirm', streamId),
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
    await this.moduleApi.execute('complete-stream', { streamId }, actor.uuid);
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
    await this.moduleApi.execute('archive-stream', { streamId }, actor.uuid);
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

  /** Форматирует время из ISO-строки (ЧЧ:ММ). */
  #formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return iso;
    }
  }
}
