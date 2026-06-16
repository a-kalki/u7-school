import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { User } from '@u7-scl/app/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';
import { U7BotUserStory } from '@u7-scl/app/ui';

/**
 * US-8: Мониторинг прогресса группы.
 * Ментор видит список студентов потока и их прогресс.
 */
export class MonitorStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'monitor';

  async handleCallback(
    action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');
    if (cmd !== 'students' || !streamId) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

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

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }

}
