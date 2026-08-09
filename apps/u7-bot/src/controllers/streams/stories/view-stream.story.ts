import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type {
  BotResponse,
  BotUpdate,
  KeyboardDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type {
  CategorizedStudent,
  Stream,
  Student,
} from '@u7-scl/stream/domain';
import { StreamDs, StreamPolicy, StudentPolicy } from '@u7-scl/stream/domain';
import type { TreeNode } from '../../../shared/tree-renderer';
import { renderTree } from '../../../shared/tree-renderer';

/** Контекст для captureInput при вводе кодового слова */
interface EnrollKeyContext {
  streamId: string;
  enrollmentKey: string;
  attempts: number;
}

const MAX_ENROLL_ATTEMPTS = 3;

/**
 * S02-S04: Детальная карточка потока (curious-режим).
 * Показывает описание, статус, дату старта, имя ментора и публичные кнопки.
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

    if (cmd === 'students' && streamId) {
      return this.handleStudentsList(streamId, actor);
    }

    if (cmd === 'enroll' && streamId) {
      return this.handleEnrollStart(streamId, actor);
    }

    if (cmd === 'cancel' && streamId) {
      return this.handleEnrollCancel(streamId);
    }

    if (cmd !== 'view' || !streamId) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    return this.handleView(streamId, actor);
  }

  override async handleMessage(
    update: BotUpdate,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    if (update.type !== 'message') {
      return { sendMessage: { text: '⚠️ Ожидалось текстовое сообщение' } };
    }

    const ctx = session.activeHandler?.context as EnrollKeyContext | undefined;
    if (!ctx || session.activeHandler?.path !== 'view-stream/enroll-key') {
      return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
    }

    const enteredKey = update.text;

    if (enteredKey !== ctx.enrollmentKey) {
      const attemptsLeft = MAX_ENROLL_ATTEMPTS - ctx.attempts - 1;
      if (attemptsLeft <= 0) {
        return {
          releaseInput: true,
          sendMessage: {
            text: '❌ Попытки исчерпаны.\nВозврат к потоку — нажмите кнопку ниже.',
            keyboard: {
              rows: [
                [
                  {
                    text: '⬅️ Назад к потоку',
                    code: this.cbFor(this.storyName, 'view', ctx.streamId),
                  },
                ],
              ],
              isMultiple: false,
            },
          },
        };
      }

      return {
        sendMessage: {
          text: `❌ Неверное слово. Осталось попыток: ${attemptsLeft}`,
          keyboard: {
            rows: [
              [
                {
                  text: '❌ Отмена',
                  code: this.cbFor(this.storyName, 'cancel', ctx.streamId),
                },
              ],
            ],
            isMultiple: false,
          },
        },
        captureInput: {
          path: 'view-stream/enroll-key',
          context: {
            ...ctx,
            attempts: ctx.attempts + 1,
          } satisfies EnrollKeyContext,
        },
      };
    }

    // Верное слово — зачисляем
    return this.#doEnroll(ctx.streamId, actor, ctx.enrollmentKey);
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

    // Кнопка «👥 Студенты» — свой обработчик
    rows.push([
      {
        text: '👥 Студенты',
        code: this.cbFor(this.storyName, 'students', stream.uuid),
      },
    ]);

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
          {
            text: '📝 Записаться',
            code: this.cbFor(this.storyName, 'enroll', stream.uuid),
          },
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

  // ── Обработчик «👥 Студенты» ──

  protected async handleStudentsList(
    streamId: string,
    actor: User,
  ): Promise<BotResponse> {
    const students = (await this.appApi.execute(
      'list-stream-students',
      { streamId },
      actor.uuid,
    )) as Student[];

    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as Stream;

    if (!stream) {
      return { sendMessage: { text: '⚠️ Поток не найден' } };
    }

    // Категоризируем через DS
    const categorized = StreamDs.categorizeStudents(students, new Date());
    const lagMap = new Map(categorized.map((c) => [c.studentId, c.lagLevel]));

    interface StudentRow {
      student: Student;
      name: string;
      progress: { completed: number; total: number; percent: number };
      lagLevel: CategorizedStudent['lagLevel'];
    }

    const rows: StudentRow[] = [];
    for (const s of students) {
      const progress = StreamDs.computeProgress(stream.contentSnapshot, s);
      const lagLevel = lagMap.get(s.uuid) ?? 'on_track';

      let name = s.userId.slice(0, 8);
      try {
        const user = await this.appApi.execute('get-user', {
          uuid: s.userId,
        });
        name = user.name;
      } catch {
        // оставляем обрезок userId
      }

      rows.push({ student: s, name, progress, lagLevel });
    }

    // Сортировка: 🛑 → ⚠️ → 🏃 по прогрессу → ✅
    const lagOrder: Record<string, number> = {
      critical: 0,
      lagging: 1,
      on_track: 2,
    };

    rows.sort((a, b) => {
      const la = lagOrder[a.lagLevel] ?? 3;
      const lb = lagOrder[b.lagLevel] ?? 3;
      if (la !== lb) return la - lb;

      const aDone =
        a.student.status !== 'active' && a.student.status !== 'enrolled';
      const bDone =
        b.student.status !== 'active' && b.student.status !== 'enrolled';
      if (aDone !== bDone) return aDone ? 1 : -1;

      return b.progress.percent - a.progress.percent;
    });

    // Статистика
    let activeCount = 0;
    let advancedCount = 0;
    let notAdvancedCount = 0;
    let abandonedCount = 0;

    for (const r of rows) {
      const status = r.student.status;
      if (status === 'active' || status === 'enrolled') {
        activeCount++;
      } else if (status === 'advanced') {
        advancedCount++;
      } else if (status === 'not_advanced') {
        notAdvancedCount++;
      } else if (status === 'abandoned') {
        abandonedCount++;
      }
    }

    // Клавиатура
    const keyboardRows: Array<Array<{ text: string; code: string }>> = [];
    const canManage = StudentPolicy.canManageStudent(actor, stream);

    // Строки студентов для текста
    const studentLines: string[] = [];

    for (const r of rows) {
      const marker = this.#lagMarker(r.lagLevel, r.student.status);
      const isActive =
        r.student.status === 'active' || r.student.status === 'enrolled';

      const summary = StreamDs.computeStudentRowSummary(
        stream.contentSnapshot,
        r.student,
      );

      const bar = this.#formatProgressBar(
        summary.progress.completed,
        summary.progress.total,
      );
      const parts = [
        `${marker} ${this.escapeMarkdown(r.name)}`,
        `${bar} ${summary.progress.percent}%`,
      ];
      if (summary.dominantCategory && summary.medianTimeMinutes !== null) {
        parts.push(
          `${summary.dominantCategory.emoji} ${summary.dominantCategory.name}: ${summary.medianTimeMinutes} мин`,
        );
      }
      studentLines.push(parts.join(' \\| '));

      const nameBtn = `${marker} ${r.name} — ${summary.progress.percent}%`;

      const studentRow: Array<{ text: string; code: string }> = [
        {
          text: nameBtn,
          code: this.cbFor('monitor', 'detail', r.student.uuid),
        },
      ];

      if (isActive && canManage) {
        studentRow.push({
          text: '⛔',
          code: this.cbFor('monitor', 'mark-abandoned', r.student.uuid),
        });
        studentRow.push({
          text: '✅',
          code: this.cbFor('monitor', 'complete', r.student.uuid),
        });
      } else if (
        canManage &&
        (r.student.status === 'advanced' || r.student.status === 'not_advanced')
      ) {
        studentRow.push({
          text: '🔄',
          code: this.cbFor('monitor', 'complete', r.student.uuid),
        });
      }

      keyboardRows.push(studentRow);
    }

    keyboardRows.push([
      {
        text: '⬅️ Назад к потоку',
        code: this.cbFor(this.storyName, 'view', streamId),
      },
    ]);

    const countLabel = this.#pluralize(
      students.length,
      'студент',
      'студента',
      'студентов',
    );

    const header = [
      `👥 *Студенты потока* — _${this.escapeMarkdown(stream.title)}_`,
      '',
      `Всего: ${students.length} ${countLabel}`,
    ];

    const metrics: string[] = [];
    if (activeCount > 0) metrics.push(`🏃 В процессе: ${activeCount}`);
    if (advancedCount > 0) metrics.push(`✅ Прошли: ${advancedCount}`);
    if (notAdvancedCount > 0) metrics.push(`↩️ Не прошли: ${notAdvancedCount}`);
    if (abandonedCount > 0) metrics.push(`🚫 Выбыли: ${abandonedCount}`);

    header.push('', '———');

    if (metrics.length > 0) {
      header.push('', '*Метрики группы:*', ...metrics);
    }

    header.push(
      '',
      '*Легенда:*',
      '🏃 учится   ✅ прошёл   ↩️ не прошёл   🚫 выбыл',
      '',
      '———',
      '',
      '*Метрики по студентам:*',
    );

    for (const line of studentLines) {
      header.push(line);
    }

    header.push('');
    header.push('*Легенда:*');
    header.push('🛑 критическое отставание, кандидат на отчисление');
    header.push('⚠️ учится, но отстаёт от группы');
    header.push('🏃 в норме, учится');
    header.push('🚫 забросил учебу');
    header.push('↩️ завершил модуль, но пройдет заново');
    header.push('✅ завершил модуль, проходит дальше');

    return {
      sendMessage: {
        text: header.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows: keyboardRows, isMultiple: false },
      },
    };
  }

  /** Возвращает маркер отставания с учётом статуса */
  #lagMarker(lagLevel: CategorizedStudent['lagLevel'], status: string): string {
    if (status === 'advanced') return '✅';
    if (status === 'not_advanced') return '↩️';
    if (status === 'abandoned') return '🚫';
    if (lagLevel === 'critical') return '🛑';
    if (lagLevel === 'lagging') return '⚠️';
    return '🏃';
  }

  /**
   * Форматирует прогресс-бар для Telegram MarkdownV2.
   * Скобки экранированы: \[ ████░░░░ \]
   */
  #formatProgressBar(completed: number, total: number): string {
    const width = 10;
    const filled = total === 0 ? 0 : Math.round((completed / total) * width);
    const empty = width - filled;
    return `\\[${'█'.repeat(filled)}${'░'.repeat(empty)}\\] ${completed}/${total}`;
  }

  /** Склоняет существительное: 1 студент, 2 студента, 5 студентов */
  #pluralize(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  // ── Обработчики «📝 Записаться» ──

  protected async handleEnrollStart(
    streamId: string,
    actor: User,
  ): Promise<BotResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as { enrollmentKey?: string; title: string };

    // Если есть кодовое слово — запрашиваем его
    if (stream.enrollmentKey) {
      return {
        sendMessage: {
          text: '🔑 Введите кодовое слово для записи на поток:',
          keyboard: {
            rows: [
              [
                {
                  text: '❌ Отмена',
                  code: this.cbFor(this.storyName, 'cancel', streamId),
                },
              ],
            ],
            isMultiple: false,
          },
        },
        captureInput: {
          path: 'view-stream/enroll-key',
          context: {
            streamId,
            enrollmentKey: stream.enrollmentKey,
            attempts: 0,
          } satisfies EnrollKeyContext,
        },
      };
    }

    // Без кодового слова — сразу зачисляем
    return this.#doEnroll(streamId, actor);
  }

  protected async handleEnrollCancel(streamId: string): Promise<BotResponse> {
    return {
      releaseInput: true,
      delegate: {
        path: this.cbFor(this.storyName, 'view', streamId),
      },
    };
  }

  async #doEnroll(
    streamId: string,
    actor: User,
    enrollmentKey?: string,
  ): Promise<BotResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as {
      title: string;
      startDate: string;
      telegramGroupInvite?: string;
    };

    await this.appApi.execute(
      'enroll-student',
      {
        streamId,
        userId: actor.uuid,
        enrollmentKey,
      },
      actor.uuid,
    );

    const dateStr = this.#formatDate(stream.startDate);
    const lines = [
      '🎉 *Вы успешно записаны на поток\\!*',
      '',
      `📋 _${this.escapeMarkdown(stream.title)}_`,
      `📅 Обучение начнётся: ${this.escapeMarkdown(dateStr)}`,
    ];

    if (stream.telegramGroupInvite) {
      lines.push('', `🔗 ${this.escapeMarkdown(stream.telegramGroupInvite)}`);
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
      },
      delegate: { path: 'hub:my-study' },
    };
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
