import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md, mdConcat, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import { StreamDs } from '@u7-scl/stream/domain';
import { buttons } from '../../shared/buttons';
import { formatProgressBar, getStudent } from '../shared';

/**
 * Прогресс студента (S06).
 * Показывает общую статистику прохождения потока.
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
    const studentResult = await getStudent(this.appApi, actor.uuid);
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

    const tree = StreamDs.buildNavigationTree(stream.contentSnapshot, student);
    const moduleProgress = StreamDs.computeProgress(
      stream.contentSnapshot,
      student,
    );

    const lines: MdText[] = [
      md`📊 *Мой прогресс* — ${stream.title}`,
      md``,
      mdConcat(
        md`📊 Общий: `,
        formatProgressBar(moduleProgress.completed, moduleProgress.total),
      ),
      md``,
    ];

    // Прогресс по проектам
    let pi = 0;
    for (const project of stream.contentSnapshot) {
      pi++;
      const projProgress = StreamDs.computeProgress([project], student);
      const projectNode = tree.projects[pi - 1];
      const icon =
        projectNode?.status === 'completed'
          ? '✅'
          : projectNode?.status === 'current'
            ? '▶️'
            : '🔒';
      lines.push(
        mdConcat(
          md`${icon} *Проект ${pi}: ${project.projectTitle}* — `,
          formatProgressBar(projProgress.completed, projProgress.total),
        ),
      );

      for (const lesson of project.lessons) {
        const lessonProgress = StreamDs.computeProgress(
          [{ ...project, lessons: [lesson] }],
          student,
        );
        const lessonNode = projectNode?.lessons.find(
          (l) => l.lessonId === lesson.lessonId,
        );
        const lIcon =
          lessonNode?.status === 'completed'
            ? '  ✅'
            : lessonNode?.status === 'current'
              ? '  ▶️'
              : '  🔒';
        lines.push(
          mdConcat(
            md`    ${lIcon} ${lesson.lessonTitle} — `,
            formatProgressBar(lessonProgress.completed, lessonProgress.total),
          ),
        );
      }
    }

    lines.push(
      md``,
      md`📝 Всего шагов завершено: ${moduleProgress.completed} из ${moduleProgress.total}`,
    );

    return this.screen(
      mdJoin(lines),
      this.kb([
        [this.btn('⬅️ Назад к учёбе', this.cbFor('hub', 'my-study'))],
        [buttons.mainMenu()],
      ]),
    );
  }
}
