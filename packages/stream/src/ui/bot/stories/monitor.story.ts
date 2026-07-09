import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';
import type { Student } from '../../../domain/student/entity';
import { StudentPolicy } from '../../../domain/student/policy';

/**
 * US-8: Мониторинг прогресса группы.
 * Публичный список студентов с прогресс-барами.
 * Детальная карточка — кнопки действий только для ментора потока.
 */
export class MonitorStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'monitor';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, id] = action.split(':');

    // Детальная карточка студента
    if (cmd === 'detail' && id) {
      return this.#handleDetail(id, actor);
    }

    // История шагов — ещё не реализована
    if (cmd === 'history' && id) {
      return {
        sendMessage: {
          text: '🚧 История шагов ещё не реализована, но скоро будет.',
        },
      };
    }

    // mark-abandoned — подтверждение
    if (cmd === 'mark-abandoned' && id) {
      return this.#handleMarkAbandonedConfirm(id, actor);
    }

    // mark-abandoned — выполнить
    if (cmd === 'mark-abandoned-confirm' && id) {
      return this.#handleMarkAbandonedExecute(id, actor, action);
    }

    // complete-student — выбор исхода
    if (cmd === 'complete' && id) {
      return this.#handleCompleteChoice(id);
    }

    // complete-student — подтверждение исхода
    if (cmd === 'complete-confirm' && id) {
      return this.#handleCompleteConfirm(id, actor, action);
    }

    if (cmd !== 'students' || !id) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    return this.#handleStudents(id, actor);
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }

  // ── Приватные методы ──

  async #handleStudents(streamId: string, actor: User): Promise<BotResponse> {
    const students = await this.moduleApi.execute(
      'list-stream-students',
      { streamId },
      actor.uuid,
    );

    const stream = await this.moduleApi.execute('get-stream', {
      streamId,
    });

    const totalSteps = stream.contentSnapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );

    const studentLines: string[] = [];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const s of students) {
      const completed = s.steps.filter(
        (st) => st.status === 'completed',
      ).length;
      const pct =
        totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;

      const barLen = 10;
      const filled = Math.round((pct / 100) * barLen);
      const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
      const lagging = pct < 25 && s.status === 'active' ? ' ⚠️' : '';

      const pos = this.#findStepPosition(
        stream.contentSnapshot,
        s.currentStepId,
      );
      const posStr = pos
        ? `p${pos.projectIndex}:l${pos.lessonIndex}:s${pos.stepIndex}`
        : '';

      let name = s.userId.slice(0, 8);
      try {
        const user = await this.appApi.execute('get-user', {
          uuid: s.userId,
        });
        name = user.name;
      } catch (err) {
        this.handleError(err);
      }

      const escapedName = this.escapeMarkdown(name);
      const counts = this.escapeMarkdown(`(${completed}/${totalSteps})`);

      studentLines.push(
        `${posStr} ${bar} ${pct}% ${counts} — ${escapedName}${lagging}`,
      );

      rows.push([
        {
          text: `👤 ${name} (${pct}%)${lagging}`,
          code: this.cbFor('monitor', 'detail', s.uuid),
        },
      ]);
    }

    rows.push([
      { text: '⬅️ Назад к потоку', code: `view-stream:view:${streamId}` },
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
      '',
    ];

    const text = [...header, ...studentLines].join('\n');

    return {
      sendMessage: {
        text,
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
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

  async #handleDetail(studentId: string, actor: User): Promise<BotResponse> {
    const student: Student = await this.moduleApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch (err) {
      this.handleError(err);
    }

    const stream = await this.moduleApi.execute('get-stream', {
      streamId: student.streamId,
    });

    const totalSteps = stream.contentSnapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );
    const completed = student.steps.filter(
      (st) => st.status === 'completed',
    ).length;
    const pct = totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;

    const statusLabels: Record<string, string> = {
      active: '🟢 Активен',
      abandoned: '🔴 Выбыл',
      advanced: '✅ Прошёл',
      not_advanced: '↩️ Не прошёл',
    };

    const lines = [
      `👤 *${this.escapeMarkdown(userName)}*`,
      '',
      `📊 Статус: ${statusLabels[student.status] ?? student.status}`,
      `📈 Прогресс: ${completed} из ${totalSteps} шагов ${this.escapeMarkdown(`(${pct}%)`)}`,
    ];

    const currentStep = student.steps.find((st) => st.status === 'issued');
    if (currentStep) {
      for (const project of stream.contentSnapshot) {
        for (const lesson of project.lessons) {
          if (lesson.stepIds.includes(currentStep.stepId)) {
            lines.push(
              `📁 Проект: ${this.escapeMarkdown(project.projectTitle)}`,
            );
            lines.push(`📝 Урок: ${this.escapeMarkdown(lesson.lessonTitle)}`);
          }
        }
      }
    }

    const keyboardRows: Array<Array<{ text: string; code: string }>> = [];

    keyboardRows.push([
      {
        text: '📁 История шагов',
        code: this.cbFor('monitor', 'history', studentId),
      },
    ]);

    // Кнопки действий — только для ментора потока или админа
    if (StudentPolicy.canExpel(actor, stream)) {
      if (student.status === 'active') {
        // Активный студент: можно отметить неактивным или завершить
        keyboardRows.push([
          {
            text: '⚠️ Неактивен',
            code: this.cbFor('monitor', 'mark-abandoned', studentId),
          },
          {
            text: '✅ Завершить',
            code: this.cbFor('monitor', 'complete', studentId),
          },
        ]);
      } else if (
        student.status === 'advanced' ||
        student.status === 'not_advanced'
      ) {
        // Завершённый студент: можно сменить предпочтение (пока заглушка)
        keyboardRows.push([
          {
            text: '🔄 Сменить исход',
            code: this.cbFor('monitor', 'complete', studentId),
          },
        ]);
      }
    }

    keyboardRows.push([
      {
        text: '⬅️ Назад к списку',
        code: this.cbFor('monitor', 'students', student.streamId),
      },
    ]);

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows: keyboardRows, isMultiple: false },
      },
    };
  }

  // ── mark-abandoned ──

  async #handleMarkAbandonedConfirm(
    studentId: string,
    actor: User,
  ): Promise<BotResponse> {
    const student: Student = await this.moduleApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch {
      // ignore
    }

    return this.confirm(
      'mark-abandoned',
      studentId,
      `⚠️ Отметить *${this.escapeMarkdown(userName)}* как неактивного?`,
      {
        confirmButton: '⚠️ Да, неактивен',
      },
    );
  }

  async #handleMarkAbandonedExecute(
    studentId: string,
    actor: User,
    _action: string,
  ): Promise<BotResponse> {
    const student: Student = await this.moduleApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch {
      // ignore
    }

    try {
      await this.moduleApi.execute(
        'mark-abandoned',
        { streamId: student.streamId, studentId },
        actor.uuid,
      );
    } catch (err: unknown) {
      return this.handleError(err);
    }

    return {
      sendMessage: {
        text: `✅ Студент *${this.escapeMarkdown(userName)}* отмечен как неактивный.`,
        parseMode: 'MarkdownV2',
      },
      delegate: {
        path: this.cbFor('monitor', 'students', student.streamId),
      },
    };
  }

  // ── complete-student (выбор исхода) ──

  async #handleCompleteChoice(studentId: string): Promise<BotResponse> {
    const keyboardRows: Array<Array<{ text: string; code: string }>> = [
      [
        {
          text: '✅ Прошёл',
          code: this.cbFor('monitor', 'complete-confirm', studentId) +
            ':advanced',
        },
      ],
      [
        {
          text: '↩️ Не прошёл',
          code: this.cbFor('monitor', 'complete-confirm', studentId) +
            ':not_advanced',
        },
      ],
      [
        {
          text: '🔴 Выбыл',
          code: this.cbFor('monitor', 'complete-confirm', studentId) +
            ':abandoned',
        },
      ],
      [
        {
          text: '❌ Отмена',
          code: this.cbFor('monitor', 'detail', studentId),
        },
      ],
    ];

    return {
      sendMessage: {
        text: 'Выберите исход для студента:',
        keyboard: { rows: keyboardRows, isMultiple: false },
      },
    };
  }

  async #handleCompleteConfirm(
    studentId: string,
    actor: User,
    action: string,
  ): Promise<BotResponse> {
    // action = 'complete-confirm:studentId:outcome'
    const parts = action.split(':');
    const outcome = parts[2]; // advanced | not_advanced | abandoned

    const student: Student = await this.moduleApi.execute(
      'get-student-progress',
      { studentId },
      actor.uuid,
    );

    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch {
      // ignore
    }

    const outcomeLabels: Record<string, string> = {
      advanced: 'прошёл',
      not_advanced: 'не прошёл',
      abandoned: 'выбыл',
    };

    return this.confirm(
      'complete',
      studentId,
      `Завершить студента *${this.escapeMarkdown(userName)}* с исходом «${outcomeLabels[outcome ?? ''] ?? outcome}»?`,
      {
        confirmButton: '✅ Завершить',
        extraData: outcome,
      },
    );
  }
  // Примечание: выполнение complete-confirm (complete + outcome) пока не реализовано —
  // будет добавлено после того, как complete-student-uc станет доступен в moduleApi

  /** Находит позицию шага в contentSnapshot: индексы проекта, урока и шага (1-based). */
  #findStepPosition(
    snapshot: ContentSnapshot,
    stepId: string,
  ): { projectIndex: number; lessonIndex: number; stepIndex: number } | null {
    for (let pi = 0; pi < snapshot.length; pi++) {
      const project = snapshot[pi];
      if (!project) continue;
      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson) continue;
        const idx = lesson.stepIds.indexOf(stepId);
        if (idx !== -1) {
          return {
            projectIndex: pi + 1,
            lessonIndex: li + 1,
            stepIndex: idx + 1,
          };
        }
      }
    }
    return null;
  }
}
