import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md, mdConcat, mdJoin, mdRaw } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import { StreamDs } from '@u7-scl/stream/domain';
import { buttons } from '../../shared/buttons';
import { formatProgressBar, getStudent } from '../shared';

/**
 * Прогресс студента (S06).
 * Показывает детальные персональные метрики прохождения потока.
 */
export class ProgressStory extends U7BotUiStory {
  readonly name = 'progress';

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (action.startsWith('progress:')) {
      const streamId = action.split(':')[1];
      if (!streamId) {
        return this.unknownCommand(action, actor, session);
      }
      return this.#showProgress(actor, streamId);
    }
    return this.unknownCommand(action, actor, session);
  }

  async #showProgress(actor: User, streamId: string): Promise<DialogResponse> {
    const studentResult = await getStudent(this.appApi, actor);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    if (student.streamId !== streamId) {
      return this.screen(
        md`⚠️ Этот прогресс не соответствует вашему текущему потоку\\.`,
      );
    }

    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as {
      title: string;
      contentSnapshot: ContentSnapshot;
    };

    if (!stream?.contentSnapshot) {
      return this.screen(md`⚠️ Программа потока не найдена\\.`);
    }

    const card = StreamDs.computeStudentCard(stream.contentSnapshot, student);
    const projectProgress = StreamDs.computeStreamProjectProgress(
      stream.contentSnapshot,
      student,
    );

    const lines: MdText[] = [
      md`📊 *Мой прогресс* — ${stream.title}`,
      md``,
      mdRaw('———'),
      md``,
      md`*Общий прогресс:*`,
      mdConcat(
        md`📊 Пройдено шагов: `,
        formatProgressBar(
          card.moduleProgress.completed,
          card.moduleProgress.total,
        ),
        md` \\| ${card.moduleProgress.percent}%`,
      ),
      md`📁 Проекты курса: ${projectProgress.completed} из ${projectProgress.total} завершено`,
    ];

    if (card.currentProject) {
      lines.push(
        md``,
        mdRaw('———'),
        md``,
        md`*Текущий этап:*`,
        md`📁 Проект: «${card.currentProject.title}»`,
      );
      if (card.currentLesson) {
        lines.push(md`📝 Урок: «${card.currentLesson.title}»`);
      }
      lines.push(
        mdConcat(
          md`📊 Прогресс по проекту: `,
          formatProgressBar(
            card.currentProject.progress.completed,
            card.currentProject.progress.total,
          ),
          md` \\| ${card.currentProject.progress.percent}%`,
        ),
      );
    }

    lines.push(md``, mdRaw('———'), md``, md`*Темп и усидчивость:*`);

    if (card.medianTimeMinutes !== null) {
      lines.push(md`⏱ Типичное время на шаг: ${card.medianTimeMinutes} мин\\.`);
    }

    const catDescs: Record<string, string> = {
      Бегун: '< 1 мин\\.',
      Спринтер: '< 5 мин\\.',
      Вдумчивый: '< 15 мин\\.',
      Исследователь: '\\> 15 мин\\.',
    };
    for (const c of card.timeCategories) {
      const desc = catDescs[c.name] ?? '';
      lines.push(
        mdConcat(
          md`${c.emoji} ${c.name} `,
          mdRaw(`\\(${desc}\\)`),
          md`: ${c.count} шаг\\(ов\\)`,
        ),
      );
    }

    if (student.enrolledAt) {
      const enrolledDate = new Date(student.enrolledAt);
      const day = String(enrolledDate.getDate()).padStart(2, '0');
      const month = String(enrolledDate.getMonth() + 1).padStart(2, '0');
      const year = enrolledDate.getFullYear();
      const dateStr = `${day}.${month}.${year}`;
      const days = Math.max(
        1,
        Math.floor(
          (Date.now() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      lines.push(
        md``,
        mdRaw('———'),
        md``,
        md`📅 В обучении: с ${dateStr} \\(${days} дн\\.\\)`,
      );
    }

    return this.screen(
      mdJoin(lines),
      this.kb([
        [this.btn('⬅️ Назад к учёбе', this.cbFor('hub', 'my-study'))],
        [buttons.mainMenu()],
      ]),
    );
  }
}
