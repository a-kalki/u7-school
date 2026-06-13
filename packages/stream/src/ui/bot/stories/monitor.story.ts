import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { BotUserStory } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';

interface StudentInfo {
  uuid: string;
  userId: string;
  status: string;
  steps: Array<{ status: string }>;
}

interface StreamInfo {
  uuid: string;
  title: string;
  contentSnapshot: Array<{
    lessons: Array<{ stepIds: string[] }>;
  }>;
}

/**
 * US-8: Мониторинг прогресса группы.
 * Ментор видит список студентов потока и их прогресс.
 */
export class MonitorStory extends BotUserStory<StreamAppMeta> {
  readonly name = 'monitor';

  async handleCallback(
    action: string,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    const parts = action.split(':');
    if (parts[0] !== 'students' || !parts[1]) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const streamId = parts[1]!;

    const students = (await this.api.execute('list-stream-students', {
      streamId,
    })) as unknown as StudentInfo[];

    const stream = (await this.api.execute('get-stream', {
      streamId,
    })) as unknown as StreamInfo;

    const totalSteps = stream.contentSnapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );

    const lines = ['👥 *Студенты потока*'];

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

  override async handleMessage(): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(_actor: unknown): Promise<null> {
    return null;
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
