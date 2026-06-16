import type {
  BotResponse,
  KeyboardDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';
import { U7BotUserStory } from '@u7-scl/app/ui';

/** Упрощённый интерфейс актора для проверки ролей */
interface Actor {
  uuid: string;
  roles: string[];
}

interface StreamDetail {
  uuid: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  mentorId: string;
  goal?: string;
  result?: string;
  rules?: string;
  additional?: string;
  targetAudience?: string;
  telegramGroupId?: string;
  telegramGroupInvite?: string;
  contentSnapshot?: Array<{
    projectTitle: string;
    lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
  }>;
}

interface UserInfo {
  uuid: string;
  name: string;
  roles: string[];
}

/**
 * US-2: Детальная карточка потока.
 * Показывает описание, статус, дату старта, имя ментора и ролевые кнопки.
 */
export class ViewStreamStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'view-stream';

  async handleCallback(
    action: string,
    actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    const parts = action.split(':');

    // Показ программы курса
    if (parts[0] === 'program' && parts[1]) {
      return this.#handleProgram(parts[1]!);
    }

    if (parts[0] !== 'view' || !parts[1]) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    return this.#handleView(parts[1]!, actor as Actor);
  }

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: unknown): Promise<null> {
    return null;
  }

  // ── Приватные методы ──

  async #handleView(streamId: string, a: Actor): Promise<BotResponse> {
    const stream = (await this.moduleApi.execute('get-stream', {
      streamId,
    })) as unknown as StreamDetail;

    const students = (await this.moduleApi.execute('list-stream-students', {
      streamId,
    })) as unknown as Array<{ uuid: string }>;

    // Получаем имя ментора
    let mentorName = '';
    try {
      const mentor = (await this.moduleApi.execute('get-user', {
        userId: stream.mentorId,
      })) as unknown as UserInfo;
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

    const dateStr = this.#formatDate(stream.startDate);

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
    const keyboard = this.#buildKeyboard(stream, a);

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
    })) as unknown as StreamDetail;

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

  #buildKeyboard(
    stream: StreamDetail,
    a: Actor,
  ): KeyboardDescription {
    const isGuestCandidate = a.roles.some((r) =>
      ['GUEST', 'CANDIDATE'].includes(r),
    );
    const rows: Array<Array<{ text: string; code: string }>> = [];

    // Кнопка «Записаться» только для GUEST/CANDIDATE на enrollment
    if (stream.status === 'enrollment' && isGuestCandidate) {
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
    if (stream.status === 'active' && isGuestCandidate) {
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

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
