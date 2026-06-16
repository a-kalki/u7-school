import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';
import { U7BotUserStory } from '@u7-scl/app/ui';

interface StudentProgress {
  steps: Array<{ status: string }>;
}

interface StreamSnapshot {
  title: string;
  contentSnapshot: Array<{
    lessons: Array<{ stepIds: string[] }>;
  }>;
}

/**
 * US-5: Просмотр прогресса студента.
 * Показывает прогресс-бар и проценты завершения.
 */
export class ProgressStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'progress';

  async handleCallback(
    action: string,
    actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    const parts = action.split(':');
    if (parts[0] !== 'progress' || !parts[1]) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const streamId = parts[1]!;
    const a = actor as { uuid: string };

    const student = (await this.moduleApi.execute('get-student-by-user', {
      userId: a.uuid,
    })) as unknown as StudentProgress;

    const stream = (await this.moduleApi.execute('get-stream', {
      streamId,
    })) as unknown as StreamSnapshot;

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
