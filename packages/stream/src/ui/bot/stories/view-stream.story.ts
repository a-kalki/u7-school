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
    const students = await this.moduleApi.execute('list-stream-students', {
      streamId,
    });

    // Получаем имя ментора через appApi (модуль user)
    let mentorName = '';
    try {
      const mentor = await this.appApi.execute('get-user', {
        uuid: stream.mentorId,
      });
      mentorName = mentor.name;
    } catch {
      // Ментор не найден — оставляем имя пустым
    }

    const statusLabels: Record<string, string> = {
      enrollment: '🟢 Набор открыт',
      active: '🔵 Идёт обучение',
      completed: '⚪ Завершён',
      archived: '⚪ Архивирован',
    };

    const dateStr = this.formatDate(stream.startDate);

    const lines = [
      `📋 *${this.escapeMarkdown(stream.title)}*`,
      '',
      `_${this.escapeMarkdown(stream.description)}_`,
      '',
      `👤 Ментор: ${this.escapeMarkdown(mentorName)}`,
      `📅 Старт: ${this.escapeMarkdown(dateStr)}`,
      `👥 Студентов: ${students.length}`,
      `📌 Статус: ${statusLabels[stream.status] ?? stream.status}`,
    ];

    if (stream.telegramGroupInvite) {
      lines.push('', `🔗 ${this.escapeMarkdown(stream.telegramGroupInvite)}`);
    }

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
          text: '📖 *Программа курса*\n\nПрограмма пока не загружена.',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [
              [
                {
                  text: '⬅️ Назад к потоку',
                  code: `view-stream:view:${streamId}`,
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
                code: `view-stream:view:${streamId}`,
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
    const rows: Array<Array<{ text: string; code: string }>> = [];

    // Кнопка «Записаться» только для GUEST/CANDIDATE на enrollment
    if (stream.status === 'enrollment' && canEnroll) {
      rows.push([
        {
          text: '📝 Записаться',
          code: `enroll:enroll:${stream.uuid}`,
        },
      ]);
    }

    // Кнопка «Программа курса» для всех на enrollment
    if (stream.status === 'enrollment') {
      rows.push([
        {
          text: '📖 Программа курса',
          code: `view-stream:program:${stream.uuid}`,
        },
      ]);
    }

    // Кнопка «Уведомить о наборе» для GUEST/CANDIDATE на active
    if (stream.status === 'active' && canEnroll) {
      rows.push([
        {
          text: '🔔 Уведомить о наборе',
          code: `view-stream:notify:${stream.uuid}`,
        },
      ]);
    }

    // Кнопка «Назад к списку» всегда
    rows.push([
      {
        text: '⬅️ Назад к списку',
        code: 'catalog:list',
      },
    ]);

    return { rows, isMultiple: false };
  }

}
