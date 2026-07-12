import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { CourseDs } from '@u7-scl/course/domain';
import { StreamDs } from '#domain/index';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US-5: Просмотр прогресса студента.
 * Показывает прогресс-бар, имя ментора, дату старта, чат, текущий проект и урок.
 */
export class ProgressStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'progress';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    const [cmd, streamId] = action.split(':');
    if (cmd !== 'progress' || !streamId) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const student = await this.moduleApi.execute(
      'get-student-by-user',
      {
        userId: actor.uuid,
      },
      actor.uuid,
    );
    const stream = await this.moduleApi.execute('get-stream', { streamId });

    // Имя ментора
    let mentorName = '';
    try {
      const mentor = await this.appApi.execute('get-user', {
        uuid: stream.mentorId,
      });
      mentorName = mentor.name;
    } catch (err) {
      this.handleError(err);
      // Ментор не найден
    }

    // Прогресс
    const ds = new CourseDs();
    const progress = StreamDs.computeProgress(stream.contentSnapshot, student);
    const pct = progress.percent;

    const barLength = 10;
    const filled = Math.round((pct / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    // Текущий проект и урок
    const pos = ds.findStepPosition(
      stream.contentSnapshot,
      student.currentStepId,
    );

    const dateStr = this.formatDate(stream.startDate);

    const lines = [
      `📊 *Прогресс* — _${this.escapeMarkdown(stream.title)}_`,
      '',
      `👤 Ментор: ${this.escapeMarkdown(mentorName)}`,
      `📅 Старт: ${this.escapeMarkdown(dateStr)}`,
      `📁 Проект: ${this.escapeMarkdown(pos?.projectTitle || '—')}`,
      `📝 Урок: ${this.escapeMarkdown(pos?.lessonTitle || '—')}`,
      '',
      `${bar} ${pct}%`,
      `✅ ${progress.completed} / ${progress.total} шагов`,
    ];

    if (stream.telegramGroupInvite) {
      lines.push('', `🔗 ${this.escapeMarkdown(stream.telegramGroupInvite)}`);
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [[{ text: '⬅️ Назад к учёбе', code: 'learning:my-study' }]],
          isMultiple: false,
        },
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
