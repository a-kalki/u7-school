import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';
import type { Student } from '../../../domain/student/entity';

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

    // Отчисление — подтверждение
    if (cmd === 'expel' && id) {
      return this.#handleExpelConfirm(id, actor);
    }

    // Отчисление — выполнить
    if (cmd === 'expel-confirm' && id) {
      return this.#handleExpelExecute(id, actor);
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

    // Строим текст со сводкой и прогресс-барами + компактные кнопки
    const studentLines: string[] = [];
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const s of students) {
      const completed = s.steps.filter(
        (st) => st.status === 'completed',
      ).length;
      const pct =
        totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;

      // Прогресс-бар 10 символов для текста
      const barLen = 10;
      const filled = Math.round((pct / 100) * barLen);
      const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
      const lagging = pct < 25 && s.status === 'active' ? ' ⚠️' : '';

      // Позиция в программе: pB:lC:sD
      const pos = this.#findStepPosition(
        stream.contentSnapshot,
        s.currentStepId,
      );
      const posStr = pos
        ? `p${pos.projectIndex}:l${pos.lessonIndex}:s${pos.stepIndex}`
        : '';

      // Получаем имя через appApi
      let name = s.userId.slice(0, 8);
      try {
        const user = await this.appApi.execute('get-user', {
          uuid: s.userId,
        });
        name = user.name;
      } catch (err) {
        this.handleError(err);
        // Имя не найдено — используем id
      }

      const escapedName = this.escapeMarkdown(name);
      const counts = this.escapeMarkdown(`(${completed}/${totalSteps})`);

      // Строка в тексте: позиция + бар + процент + счётчики + имя
      studentLines.push(
        `${posStr} ${bar} ${pct}% ${counts} — ${escapedName}${lagging}`,
      );

      // Компактная кнопка: 👤 + имя + процент
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

    // Получаем пользователя
    let userName = student.userId.slice(0, 8);
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
    } catch (err) {
      this.handleError(err);
      // Пользователь не найден
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
      completed: '✅ Завершил',
      dropped: '🔴 Отчислен',
    };

    const lines = [
      `👤 *${this.escapeMarkdown(userName)}*`,
      '',
      `📊 Статус: ${statusLabels[student.status] ?? student.status}`,
      `📈 Прогресс: ${completed} из ${totalSteps} шагов ${this.escapeMarkdown(`(${pct}%)`)}`,
    ];

    // Текущий проект/урок из прогресса
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

    // Клавиатура: кнопки действий доступны всем
    const keyboardRows: Array<Array<{ text: string; code: string }>> = [];

    keyboardRows.push([
      {
        text: '📁 История шагов',
        code: this.cbFor('monitor', 'history', studentId),
      },
    ]);

    keyboardRows.push([
      {
        text: '❌ Отчислить',
        code: this.cbFor('monitor', 'expel', studentId),
      },
    ]);

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

  async #handleExpelConfirm(
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

    return {
      sendMessage: {
        text: `⚠️ Вы уверены, что хотите отчислить ${this.escapeMarkdown(userName)}?`,
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: 'Да, отчислить',
                code: this.cbFor('monitor', 'expel-confirm', studentId),
              },
              {
                text: '❌ Отмена',
                code: this.cbFor('monitor', 'detail', studentId),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #handleExpelExecute(
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

    try {
      await this.moduleApi.execute(
        'expel-student',
        { streamId: student.streamId, studentId },
        actor.uuid,
      );
    } catch (err: unknown) {
      return this.handleError(err);
    }

    return {
      sendMessage: {
        text: `✅ Студент ${this.escapeMarkdown(userName)} отчислен.`,
        parseMode: 'MarkdownV2',
      },
      delegate: { path: this.cbFor('monitor', 'students', student.streamId) },
    };
  }

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
