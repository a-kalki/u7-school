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
 * US-2: Детальная карточка потока (curious-режим).
 * Показывает описание, статус, дату старта, имя ментора и публичные кнопки.
 * Менторские lifecycle-кнопки убраны — перенесены в трек mentor_tools_20260713.
 */
export class ViewStreamStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'view-stream';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');

    if (cmd === 'program' && streamId) {
      return this.#handleProgram(streamId);
    }

    if (cmd === 'details' && streamId) {
      return this.#handleDetails(streamId);
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
    const stream = (await this.moduleApi.execute('get-stream', {
      streamId,
    })) as Stream;
    let studentCount = 0;
    try {
      const students = await this.moduleApi.execute(
        'list-stream-students',
        { streamId },
        actor.uuid,
      );
      studentCount = (students as unknown[]).length;
    } catch (err) {
      this.handleError(err);
    }

    let mentorName = '';
    try {
      const mentor = await this.appApi.execute('get-user', {
        uuid: stream.mentorId,
      });
      mentorName = mentor.name;
    } catch (err) {
      this.handleError(err);
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
      `📚 Курс: Fullstack JS`,
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
    const stream = (await this.moduleApi.execute('get-stream', {
      streamId,
    })) as Stream;
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

    const esc = this.escapeMarkdown;
    const lines: string[] = ['📖 *Программа курса*', ''];

    // Собираем все lessonIds для загрузки описаний шагов
    const allLessonIds = snapshot.flatMap((p) =>
      p.lessons.map((l) => l.lessonId),
    );

    let stepsByLesson: Record<string, Array<{ uuid: string; description: string }>> = {};
    if (allLessonIds.length > 0) {
      try {
        stepsByLesson = (await this.appApi.execute('get-steps-by-lessons', {
          lessonIds: allLessonIds,
        })) as typeof stepsByLesson;
      } catch {
        // если UC недоступен — показываем без шагов
      }
    }

    for (const project of snapshot) {
      lines.push(`📁 *${esc(project.projectTitle)}*`);
      for (const lesson of project.lessons) {
        const sCount = lesson.stepIds.length;
        lines.push(
          `    📝 *${esc(lesson.lessonTitle)}* — ${sCount} шаг${this.#plural(sCount, '', 'а', 'ов')}`,
        );

        // Шаги урока inline (не более 3)
        const steps = stepsByLesson[lesson.lessonId] ?? [];
        const maxSteps = Math.min(steps.length, 3);
        for (let si = 0; si < maxSteps; si++) {
          const step = steps[si];
          if (!step) continue;
          lines.push(`        ${esc(`${si + 1}.`)} ${esc(step.description)}`);
        }
        if (steps.length > 3) {
          lines.push(`        ${esc('...')}`);
        }
      }
    }

    const text = this.#truncateS02(lines.join('\n'));

    return {
      sendMessage: {
        text,
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
    const stream = (await this.moduleApi.execute('get-stream', {
      streamId,
    })) as Stream;

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

    // ── Публичные кнопки (всем) ──

    rows.push([
      {
        text: '📖 Программа курса',
        code: this.cbFor('view-stream', 'program', stream.uuid),
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
        code: this.cbFor('view-stream', 'details', stream.uuid),
      },
    ]);

    // ── Гостевые кнопки ──
    if (!isOwnerMentor) {
      if (stream.status === 'enrollment' && canEnroll) {
        rows.push([
          {
            text: '📝 Записаться',
            code: this.cbFor('enroll', 'enroll', stream.uuid),
          },
        ]);
      }

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
  #plural(count: number, one: string, two: string, five: string): string {
    const n = count % 100;
    if (n >= 11 && n <= 19) return five;
    const r = n % 10;
    if (r === 1) return one;
    if (r >= 2 && r <= 4) return two;
    return five;
  }

  #truncateS02(text: string, maxLen = 4000): string {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 15)}${this.escapeMarkdown('...')}`;
  }
}
