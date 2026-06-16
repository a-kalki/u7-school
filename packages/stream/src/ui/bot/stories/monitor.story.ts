import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';
import type { Student } from '../../../domain/student/entity';

/**
 * US-8: Мониторинг прогресса группы.
 * Ментор видит список студентов потока с именами и их прогресс.
 * Можно кликнуть на студента — открывается детальная карточка.
 */
export class MonitorStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'monitor';

  async handleCallback(
    action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, id] = action.split(':');

    // Детальная карточка студента
    if (cmd === 'detail' && id) {
      return this.#handleDetail(id);
    }

    if (cmd !== 'students' || !id) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    return this.#handleStudents(id);
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }

  // ── Приватные методы ──

  async #handleStudents(streamId: string): Promise<BotResponse> {
    const students = await this.moduleApi.execute('list-stream-students', {
      streamId,
    });

    const stream = await this.moduleApi.execute('get-stream', {
      streamId,
    });

    const totalSteps = stream.contentSnapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );

    // Резолвим имена студентов через модуль user
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const s of students) {
      const completed = s.steps.filter(
        (st) => st.status === 'completed',
      ).length;
      const pct =
        totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;

      const barLen = 5;
      const filled = Math.round((pct / 100) * barLen);
      const bar = '▓'.repeat(filled) + '░'.repeat(barLen - filled);

      const lagging = pct < 25 && s.status === 'active' ? ' ⚠️' : '';

      // Получаем имя через appApi
      let name = s.userId.slice(0, 8);
      try {
        const user = await this.appApi.execute('get-user', {
          uuid: s.userId,
        });
        name = user.name;
      } catch {
        // Имя не найдено — используем id
      }

      rows.push([
        {
          text: `${bar} ${pct}% — ${name}${lagging}`,
          code: `monitor:detail:${s.uuid}`,
        },
      ]);
    }

    return {
      sendMessage: {
        text: `👥 *Студенты потока*\n_${this.escapeMarkdown(stream.title)}_`,
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  async #handleDetail(studentId: string): Promise<BotResponse> {
    const student: Student = await this.moduleApi.execute(
      'get-student-progress',
      {
        studentId,
      },
    );

    // Получаем пользователя
    let userName = student.userId.slice(0, 8);
    let telegramUsername = '';
    let telegramId = 0;
    try {
      const user = await this.appApi.execute('get-user', {
        uuid: student.userId,
      });
      userName = user.name;
      telegramUsername = (user as any).telegramUsername ?? '';
      telegramId = user.telegramId;
    } catch {
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
    const pct =
      totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;

    const statusLabels: Record<string, string> = {
      active: '🟢 Активен',
      completed: '✅ Завершил',
      dropped: '🔴 Отчислен',
    };

    const lines = [
      `👤 *${this.escapeMarkdown(userName)}*`,
      '',
      `📱 Telegram: ${telegramUsername ? `@${this.escapeMarkdown(telegramUsername)}` : `ID ${telegramId}`}`,
      `📊 Статус: ${statusLabels[student.status] ?? student.status}`,
      `📈 Прогресс: ${completed} из ${totalSteps} шагов \(${pct}%\)`,
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
            lines.push(
              `📝 Урок: ${this.escapeMarkdown(lesson.lessonTitle)}`,
            );
          }
        }
      }
    }

    const keyboard = {
      rows: [
        [
          {
            text: '✉️ Написать',
            code: `monitor:message:${student.userId}`,
          },
          {
            text: '📁 История шагов',
            code: `monitor:history:${studentId}`,
          },
        ],
        [
          {
            text: '⬅️ Назад к списку',
            code: `monitor:students:${student.streamId}`,
          },
        ],
      ],
      isMultiple: false,
    };

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard,
      },
    };
  }
}
