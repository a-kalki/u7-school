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
        if (update.command === 'streams') return this.handleListStreams();
        if (update.command === 'my_study') return this.handleMyStudy(actorId);
      }

      // Callback-запросы от инлайн-кнопок
      if (update.type === 'callback') {
        const data = update.data;
        if (!data) return { sendMessage: { text: 'Неизвестная команда' } };

        // Формат: "action:param1:param2:..."
        const parts = data.split(':');
        const action = parts[0];

        if (action === 'stream' && parts[1] === 'view' && parts[2]) {
          return this.handleStreamView(actorId, parts[2]);
        }
        if (action === 'enroll' && parts[1]) {
          return this.handleEnroll(actorId, parts[1]);
        }
        if (action === 'complete' && parts[1] && parts[2] && parts[3]) {
          return this.handleCompleteStep(actorId, parts[1], parts[2], parts[3]);
        }
        if (action === 'progress' && parts[1]) {
          return this.handleProgress(actorId, parts[1]);
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
    // Получаем студента по actorId (userId)
    const students = await this.streamApi.handle({
      name: 'list-streams', // временно, нужен UC поиска студента по userId
      attrs: {},
    });
    return {
      sendMessage: {
        text: `📖 Прогресс:\n${this.escapeMarkdown(JSON.stringify(students))}`,
        parseMode: 'MarkdownV2',
      },
    };
  }

  async handleEnroll(
    actorId: string,
    streamId: string,
  ): Promise<BotResponse> {
    await this.streamApi.handle({
      name: 'enroll-student',
      attrs: { streamId, userId: actorId },
      actorId,
    });
    return {
      sendMessage: {
        text: '🎉 Вы успешно записаны на поток!',
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
    const result = await this.streamApi.handle({
      name: 'complete-step',
      attrs: { studentId, streamId, stepId },
      actorId,
    });
    return {
      sendMessage: {
        text: `✅ Шаг завершён!\n${this.escapeMarkdown(JSON.stringify(result))}`,
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
    _actorId: string,
    _streamId: string,
  ): Promise<BotResponse> {
    return {
      sendMessage: {
        text: '📊 Прогресс',
        parseMode: 'MarkdownV2',
      },
    };
  }
}
