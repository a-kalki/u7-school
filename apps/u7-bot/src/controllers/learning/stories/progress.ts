import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';
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
    _session: SessionData,
  ): Promise<BotResponse> {
    if (action.startsWith('progress:')) {
      const streamId = action.split(':')[1];
      if (!streamId) {
        return { sendMessage: { text: '⚠️ Не указан поток' } };
      }
      return this.#showProgress(actor, streamId);
    }
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  async #showProgress(actor: User, streamId: string): Promise<BotResponse> {
    const studentResult = await getStudent(this.appApi, actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    if (student.streamId !== streamId) {
      return {
        sendMessage: {
          text: '⚠️ Этот прогресс не соответствует вашему текущему потоку.',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as {
      title: string;
      contentSnapshot: import('@u7-scl/course/domain').ContentSnapshot;
    };

    if (!stream?.contentSnapshot) {
      return {
        sendMessage: {
          text: '⚠️ Программа потока не найдена.',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const esc = this.escapeMarkdown;
    const tree = StreamDs.buildNavigationTree(stream.contentSnapshot, student);
    const moduleProgress = StreamDs.computeProgress(
      stream.contentSnapshot,
      student,
    );

    const lines: string[] = [
      `📊 *Мой прогресс* — ${esc(stream.title)}`,
      '',
      `📊 Общий: ${formatProgressBar(moduleProgress.completed, moduleProgress.total)}`,
      '',
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
        `${icon} *Проект ${pi}: ${esc(project.projectTitle)}* — ${formatProgressBar(projProgress.completed, projProgress.total)}`,
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
          `    ${lIcon} ${esc(lesson.lessonTitle)} — ${formatProgressBar(lessonProgress.completed, lessonProgress.total)}`,
        );
      }
    }

    lines.push(
      '',
      `📝 Всего шагов завершено: ${moduleProgress.completed} из ${moduleProgress.total}`,
    );

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [{ text: '⬅️ Назад к учёбе', code: this.cbFor('hub', 'my-study') }],
            [buttons.mainMenu()],
          ],
          isMultiple: false,
        },
      },
    };
  }
}
