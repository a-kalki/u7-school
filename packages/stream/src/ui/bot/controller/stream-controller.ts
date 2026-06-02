import type { BotResponse, BotUpdate } from '@u7-scl/core/ui';
import { BotController } from '@u7-scl/core/ui';
import type { StreamApiModule } from '../../../api/module';

export class StreamController extends BotController {
  constructor(private readonly streamApi: StreamApiModule) {
    super();
  }

  async handleUpdate(update: BotUpdate, actorId: string): Promise<BotResponse> {
    try {
      // Текстовые команды бота
      if (update.type === 'command') {
        if (update.command === 'streams') return await this.handleListStreams();
        if (update.command === 'my_study')
          return await this.handleMyStudy(actorId);
        if (update.command === 'mentor')
          return await this.handleMentorPanel(actorId);
      }

      // Callback-запросы от инлайн-кнопок
      if (update.type === 'callback') {
        const data = update.data;
        if (!data) return { sendMessage: { text: 'Неизвестная команда' } };

        // Формат: "action:param1:param2:..."
        const parts = data.split(':');
        const action = parts[0];

        if (action === 'stream' && parts[1] === 'view' && parts[2]) {
          return await this.handleStreamView(actorId, parts[2]);
        }
        if (action === 'stream' && parts[1] === 'activate' && parts[2]) {
          return await this.handleActivateStream(actorId, parts[2]);
        }
        if (action === 'stream' && parts[1] === 'students' && parts[2]) {
          return await this.handleStreamStudents(actorId, parts[2]);
        }
        if (action === 'enroll' && parts[1]) {
          return await this.handleEnroll(actorId, parts[1]);
        }
        if (action === 'complete' && parts[1] && parts[2] && parts[3]) {
          return await this.handleCompleteStep(
            actorId,
            parts[1],
            parts[2],
            parts[3],
          );
        }
        if (action === 'progress' && parts[1]) {
          return await this.handleProgress(actorId, parts[1]);
        }
      }

      return { sendMessage: { text: 'Команда не поддерживается' } };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async handleListStreams(): Promise<BotResponse> {
    const streams = (await this.streamApi.handle({
      name: 'list-streams',
      attrs: {},
    })) as Array<{
      uuid: string;
      title: string;
      status: string;
    }>;

    if (streams.length === 0) {
      return {
        sendMessage: {
          text: '📚 Нет доступных потоков',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const statusEmoji: Record<string, string> = {
      enrollment: '🟢',
      active: '🔵',
      completed: '⚪',
      archived: '⚪',
    };

    const rows = streams.map((s) => [
      {
        text: `${statusEmoji[s.status] ?? '❓'} ${this.escapeMarkdown(s.title)}`,
        code: `stream:view:${s.uuid}`,
      },
    ]);

    return {
      sendMessage: {
        text: '📚 *Потоки школы*',
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  async handleMyStudy(actorId: string): Promise<BotResponse> {
    try {
      const student = (await this.streamApi.handle({
        name: 'get-student-by-user',
        attrs: { userId: actorId },
        actorId,
      })) as
        | {
            uuid: string;
            streamId: string;
            userId: string;
            status: string;
            currentStepId: string;
          }
        | undefined;

      if (!student) {
        return {
          sendMessage: {
            text: '📖 Вы не записаны ни на один поток',
            parseMode: 'MarkdownV2',
          },
        };
      }

      if (student.status === 'completed') {
        return {
          sendMessage: {
            text: '🎉 *Поздравляем!* Вы завершили обучение в потоке!',
            parseMode: 'MarkdownV2',
          },
        };
      }

      const stream = (await this.streamApi.handle({
        name: 'get-stream',
        attrs: { streamId: student.streamId },
      })) as {
        title: string;
        contentSnapshot: Array<{
          projectTitle: string;
          lessons: Array<{
            lessonTitle: string;
            stepIds: string[];
          }>;
        }>;
      };

      const stepLabel = this.#findStepLabel(
        stream.contentSnapshot,
        student.currentStepId,
      );

      return {
        sendMessage: {
          text: [
            `📖 *Моя учёба* — _${this.escapeMarkdown(stream.title)}_`,
            '',
            `📌 Текущее задание: ${stepLabel}`,
          ].join('\n'),
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [
              [
                {
                  text: '✅ Выполнено',
                  code: `complete:${student.uuid}:${student.streamId}:${student.currentStepId}`,
                },
              ],
              [
                {
                  text: '📊 Мой прогресс',
                  code: `progress:${student.streamId}`,
                },
              ],
            ],
            isMultiple: false,
          },
        },
      };
    } catch (err: unknown) {
      const ex = err as { error?: { name?: string } };
      if (ex?.error?.name === 'STREAM_NOT_FOUND') {
        return {
          sendMessage: {
            text: '📖 Вы не записаны ни на один поток',
            parseMode: 'MarkdownV2',
          },
        };
      }
      return this.handleError(err);
    }
  }

  #findStepLabel(
    snapshot: Array<{
      projectTitle: string;
      lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
    }>,
    stepId: string,
  ): string {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        const idx = lesson.stepIds.indexOf(stepId);
        if (idx !== -1) {
          return `Шаг ${idx + 1} / ${this.escapeMarkdown(lesson.lessonTitle)}`;
        }
      }
    }
    return `Шаг (${this.escapeMarkdown(stepId.slice(0, 8))}...)`;
  }

  async handleEnroll(actorId: string, streamId: string): Promise<BotResponse> {
    // Получаем поток для ссылки на чат
    const stream = (await this.streamApi.handle({
      name: 'get-stream',
      attrs: { streamId },
    })) as { title: string; telegramGroupId?: string; telegramGroupInvite?: string } | undefined;

    await this.streamApi.handle({
      name: 'enroll-student',
      attrs: { streamId, userId: actorId },
      actorId,
    });

    const lines = ['🎉 *Вы успешно записаны на поток!*', ''];
    if (stream?.title) {
      lines.push(`📋 _${this.escapeMarkdown(stream.title)}_`);
    }
    if (stream?.telegramGroupId) {
      lines.push('');
      lines.push(
        `📢 [Присоединяйтесь к чату группы](${stream.telegramGroupId})`,
      );
    }
    if (stream?.telegramGroupInvite) {
      lines.push('');
      lines.push(
        `🔗 [Присоединиться к группе потока](${stream.telegramGroupInvite})`,
      );
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
      },
    };
  }

  async handleCompleteStep(
    actorId: string,
    studentId: string,
    streamId: string,
    stepId: string,
  ): Promise<BotResponse> {
    const result = (await this.streamApi.handle({
      name: 'complete-step',
      attrs: { studentId, streamId, stepId },
      actorId,
    })) as {
      level: 'step' | 'lesson' | 'project' | 'stream';
      currentStepId?: string;
      completedLessonId?: string;
      completedProjectId?: string;
      completed?: boolean;
    };

    const levelMessages: Record<string, string> = {
      step: '✅ Шаг выполнен! Следующее задание уже ждёт.',
      lesson: '🎉 Урок завершён! Отличная работа!',
      project: '🚀 Проект завершён! Ты на шаг ближе к финишу!',
      stream:
        '🏆 *Поток полностью завершён!* Поздравляем с успешным окончанием обучения!',
    };

    return {
      sendMessage: {
        text: levelMessages[result.level] ?? '✅ Задание выполнено!',
        parseMode: 'MarkdownV2',
      },
    };
  }

  async handleStreamView(
    _actorId: string,
    streamId: string,
  ): Promise<BotResponse> {
    const stream = (await this.streamApi.handle({
      name: 'get-stream',
      attrs: { streamId },
    })) as {
      uuid: string;
      title: string;
      description: string;
      status: string;
      startDate: string;
      goal?: string;
      result?: string;
      rules?: string;
      additional?: string;
      targetAudience?: string;
      telegramGroupId?: string;
      telegramGroupInvite?: string;
    };

    const students = (await this.streamApi.handle({
      name: 'list-stream-students',
      attrs: { streamId },
    })) as Array<{ uuid: string }>;

    const statusLabels: Record<string, string> = {
      enrollment: '🟢 Набор открыт',
      active: '🔵 Идёт обучение',
      completed: '⚪ Завершён',
      archived: '⚪ Архивирован',
    };

    const dateStr = this.#formatDate(stream.startDate);

    const lines = [
      `📋 *${this.escapeMarkdown(stream.title)}*`,
      '',
      `_${this.escapeMarkdown(stream.description)}_`,
      '',
      `📅 Старт: ${this.escapeMarkdown(dateStr)}`,
      `👥 Студентов: ${students.length}`,
      `📌 Статус: ${statusLabels[stream.status] ?? stream.status}`,
    ];

    if (stream.telegramGroupInvite) {
      lines.push('', `🔗 ${this.escapeMarkdown(stream.telegramGroupInvite)}`);
    }

    const text = lines.join('\n');

    // Условные кнопки в зависимости от статуса
    const keyboard =
      stream.status === 'enrollment'
        ? {
            rows: [
              [
                {
                  text: '📝 Записаться',
                  code: `enroll:${streamId}`,
                },
              ],
            ],
            isMultiple: false,
          }
        : undefined;

    return {
      sendMessage: {
        text,
        parseMode: 'MarkdownV2',
        keyboard,
      },
    };
  }

  #formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return iso;
    }
  }

  async handleProgress(
    actorId: string,
    streamId: string,
  ): Promise<BotResponse> {
    const student = (await this.streamApi.handle({
      name: 'get-student-by-user',
      attrs: { userId: actorId },
      actorId,
    })) as {
      steps: Array<{ status: string }>;
    };

    const stream = (await this.streamApi.handle({
      name: 'get-stream',
      attrs: { streamId },
    })) as {
      title: string;
      contentSnapshot: Array<{
        lessons: Array<{ stepIds: string[] }>;
      }>;
    };

    const totalSteps = stream.contentSnapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );
    const completed = student.steps.filter(
      (s) => s.status === 'completed',
    ).length;
    const pct = totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;

    const barLength = 10;
    const filled = Math.round((pct / 100) * barLength);
    const bar = '▓'.repeat(filled) + '░'.repeat(barLength - filled);

    return {
      sendMessage: {
        text: [
          `📊 *Прогресс* — _${this.escapeMarkdown(stream.title)}_`,
          '',
          `${bar} ${pct}%`,
          `✅ ${completed} / ${totalSteps} шагов`,
        ].join('\n'),
        parseMode: 'MarkdownV2',
      },
    };
  }

  async handleMentorPanel(actorId: string): Promise<BotResponse> {
    const streams = (await this.streamApi.handle({
      name: 'list-streams',
      attrs: { mentorId: actorId },
    })) as Array<{ uuid: string; title: string; status: string }>;

    if (streams.length === 0) {
      return {
        sendMessage: {
          text: '🛠️ У вас пока нет потоков',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const statusEmoji: Record<string, string> = {
      enrollment: '🟢',
      active: '🔵',
      completed: '⚪',
      archived: '⚪',
    };

    return {
      sendMessage: {
        text: '🛠️ *Мои потоки*',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: streams.map((s) => [
            {
              text: `${statusEmoji[s.status] ?? '❓'} ${this.escapeMarkdown(s.title)}`,
              code: `stream:view:${s.uuid}`,
            },
          ]),
          isMultiple: false,
        },
      },
    };
  }

  async handleCreateStream(
    _actorId: string,
    attrs: Record<string, unknown>,
  ): Promise<BotResponse> {
    await this.streamApi.handle({
      name: 'create-stream',
      attrs,
      actorId: _actorId,
    });

    return {
      sendMessage: {
        text: '✅ *Поток успешно создан!*',
        parseMode: 'MarkdownV2',
      },
    };
  }

  async handleActivateStream(
    actorId: string,
    streamId: string,
  ): Promise<BotResponse> {
    await this.streamApi.handle({
      name: 'activate-stream',
      attrs: { streamId },
      actorId,
    });

    return {
      sendMessage: {
        text: '🚀 *Поток запущен!* Студенты получили первые задания.',
        parseMode: 'MarkdownV2',
      },
    };
  }

  async handleStreamStudents(
    _actorId: string,
    streamId: string,
  ): Promise<BotResponse> {
    const students = (await this.streamApi.handle({
      name: 'list-stream-students',
      attrs: { streamId },
    })) as Array<{
      uuid: string;
      userId: string;
      status: string;
      steps: Array<{ status: string }>;
    }>;

    const stream = (await this.streamApi.handle({
      name: 'get-stream',
      attrs: { streamId },
    })) as {
      title: string;
      contentSnapshot: Array<{
        lessons: Array<{ stepIds: string[] }>;
      }>;
    };

    const totalSteps = stream.contentSnapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );

    const lines = [`👥 *Студенты потока*`];

    for (const s of students) {
      const completed = s.steps.filter(
        (st) => st.status === 'completed',
      ).length;
      const pct =
        totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;

      // Прогресс-бар 5 символов
      const barLen = 5;
      const filled = Math.round((pct / 100) * barLen);
      const bar = '▓'.repeat(filled) + '░'.repeat(barLen - filled);

      const lagging = pct < 25 && s.status === 'active' ? ' ⚠️' : '';
      lines.push(
        `${bar} ${pct}% — ${this.escapeMarkdown(s.userId.slice(0, 8))}${lagging}`,
      );
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
      },
    };
  }
}
