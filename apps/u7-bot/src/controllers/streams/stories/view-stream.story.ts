import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type {
  BotResponse,
  KeyboardDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type { Stream } from '@u7-scl/stream/domain';
import { StreamPolicy } from '@u7-scl/stream/domain';
import type { TreeNode } from '../../../shared/tree-renderer';
import { renderTree } from '../../../shared/tree-renderer';
import type { EnrollActions } from '../../learning/stories/enroll';

/**
 * S02-S04: Детальная карточка потока (curious-режим).
 * Показывает описание, статус, дату старта, имя ментора и публичные кнопки.
 * Менторские lifecycle-кнопки убраны — перенесены в трек mentor_tools_20260713.
 *
 * TODO(Трек 5): кнопка «📝 Записаться» через getAction<EnrollActions>('start')
 * TODO(Трек 6): кнопка «👥 Студенты» через getAction<MonitorActions>('students')
 */
export class ViewStreamStory extends U7BotUserStory {
  readonly name: string = 'view-stream';

  /** Имя сторис для cbFor. */
  protected storyName = 'view-stream';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');

    if (cmd === 'program' && streamId) {
      return this.handleProgramView(streamId);
    }

    if (cmd === 'details' && streamId) {
      return this.handleDetailsView(streamId);
    }

    if (cmd !== 'view' || !streamId) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    return this.handleView(streamId, actor);
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }

  // ── Защищённые методы (доступны для наследования) ──

  protected async handleView(
    streamId: string,
    actor: User,
  ): Promise<BotResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as Stream;
    let studentCount = 0;
    try {
      const students = await this.appApi.execute(
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
      enrollment: '🟡 Набор открыт',
      active: '🔵 Идёт обучение',
      completed: '🟢 Завершён',
      archived: '⚫ Архивирован',
    };

    const dateStr = this.#formatDate(stream.startDate);
    const timeStr = this.#formatTime(stream.startDate);

    const esc = (s: string): string => this.escapeMarkdown(s);

    const lines = [
      `📋 *${esc(stream.title)}*`,
      '',
      `_${esc(stream.description)}_`,
      '',
      `👤 Ментор: ${esc(mentorName)}`,
      `📅 Старт: ${esc(dateStr)}`,
      `🕐 Время: ${esc(timeStr)}`,
      `👥 Студентов: ${studentCount}`,
      `📌 Статус: ${statusLabels[stream.status] ?? esc(stream.status)}`,
      `📚 Курс: Fullstack JS`,
    ];

    const text = lines.join('\n');
    const keyboard = this.buildKeyboard(stream, actor);

    return {
      sendMessage: {
        text,
        parseMode: 'MarkdownV2',
        keyboard: keyboard.rows.length > 0 ? keyboard : undefined,
      },
    };
  }

  protected async handleProgramView(streamId: string): Promise<BotResponse> {
    const stream = (await this.appApi.execute('get-stream', {
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
                  code: this.cbFor(this.storyName, 'view', streamId),
                },
              ],
            ],
            isMultiple: false,
          },
        },
      };
    }

    // Собираем дерево проектов для tree-renderer
    const projectNodes: TreeNode[] = snapshot.map(
      (p: {
        projectTitle: string;
        lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
      }) => ({
        title: p.projectTitle,
        emoji: '📁',
        children: p.lessons.map(
          (l: { lessonTitle: string; stepIds: string[] }) =>
            ({
              title: l.lessonTitle,
              emoji: '📝',
              meta: `${l.stepIds.length} шаг${this.#plural(l.stepIds.length, '', 'а', 'ов')}`,
            }) as TreeNode,
        ),
      }),
    );

    const treeText = renderTree(projectNodes);
    const text = `📖 *Программа курса*\n\n${treeText}`;

    return {
      sendMessage: {
        text: this.#truncate(text),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '⬅️ Назад к потоку',
                code: this.cbFor(this.storyName, 'view', streamId),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  protected async handleDetailsView(streamId: string): Promise<BotResponse> {
    const stream = (await this.appApi.execute('get-stream', {
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
    const esc = (s: string): string => this.escapeMarkdown(s);

    const lines: string[] = [`📋 *Детали: ${esc(stream.title)}*`, ''];

    if (filled.length > 0) {
      for (const f of filled) {
        lines.push(`${f.label}: ${esc(f.value ?? '')}`);
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
                code: this.cbFor(this.storyName, 'view', streamId),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  protected buildKeyboard(stream: Stream, actor: User): KeyboardDescription {
    const canEnroll = StreamPolicy.canEnroll(actor);
    const isOwnerMentor = StreamPolicy.canEdit(actor, stream);
    const rows: Array<Array<{ text: string; code: string }>> = [];

    // ── Публичные кнопки (всем) ──

    rows.push([
      {
        text: '📖 Программа курса',
        code: this.cbFor(this.storyName, 'program', stream.uuid),
      },
    ]);

    // TODO(Трек 6): кнопка «👥 Студенты» через getAction<MonitorActions>('students')
    // rows.push([this.uiApp.getAction<MonitorActions>('students')(stream.uuid)]);

    rows.push([
      {
        text: '📋 Детали',
        code: this.cbFor(this.storyName, 'details', stream.uuid),
      },
    ]);

    // ── Гостевые кнопки ──
    if (!isOwnerMentor) {
      if (stream.status === 'enrollment' && canEnroll) {
        rows.push([
          this.uiApp.getAction<EnrollActions>('enrollButton')(stream.uuid),
        ]);
      }

      if (stream.status === 'active' && canEnroll) {
        rows.push([
          {
            text: '🔔 Уведомить о наборе',
            code: this.cbFor(this.storyName, 'notify', stream.uuid),
          },
        ]);
      }
    }

    // Кнопка «⬅️ Назад к списку» — возврат в каталог
    rows.push([
      {
        text: '⬅️ Назад к списку',
        code: this.cbFor('catalog', 'list'),
      },
    ]);

    return { rows, isMultiple: false };
  }

  #formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = d.getUTCFullYear();
      return `${dd}.${mm}.${yyyy}`;
    } catch {
      return iso;
    }
  }

  #formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const min = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${min}`;
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

  #truncate(text: string, maxLen = 4000): string {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 15)}${this.escapeMarkdown('...')}`;
  }
}
