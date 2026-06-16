import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import type { User } from '@u7-scl/app/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';
import { U7BotUserStory } from '@u7-scl/app/ui';

/**
 * US-4: Прохождение обучения (активная фаза).
 * Показывает текущий шаг, обрабатывает завершение шага.
 */
export class LearningStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'learning';

  async handleCallback(
    action: string,
    actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    const a = actor as User;

    // Завершение шага: complete:<studentId>:<streamId>:<stepId>
    if (action.startsWith('complete:')) {
      return this.#handleComplete(action);
    }

    // Показ текущего шага
    if (action === 'my-study') {
      return this.#handleMyStudy(a);
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(actor: unknown): Promise<MainMenuAction | null> {
    const a = actor as User;
    if (a.roles.includes('STUDENT')) {
      return {
        text: '📖 Моя учёба',
        action: this.cb('my-study'),
        priority: 20,
      };
    }
    return null;
  }

  // ── Приватные методы ──

  async #handleMyStudy(a: User): Promise<BotResponse> {
    let student;
    try {
      student = await this.moduleApi.execute('get-student-by-user', {
        userId: a.uuid,
      });
    } catch {
      return {
        sendMessage: {
          text: '📖 Вы не записаны ни на один поток',
          parseMode: 'MarkdownV2',
        },
      };
    }

    if (student.status === 'completed') {
      return {
        sendMessage: {
          text: '🎉 *Поздравляем!* Вы завершили обучение в потоке!',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const stream = await this.moduleApi.execute('get-stream', {
      streamId: student.streamId,
    });

    const stepLabel = this.#findStepLabel(
      stream.contentSnapshot,
      student.currentStepId,
    );

    return {
      sendMessage: {
        text: [
          `📖 *Моя учёба* — _${this.escapeMarkdown(stream.title)}_`,
          '',
          `📌 Текущее задание: ${stepLabel}`,
        ].join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '✅ Выполнено',
                code: this.cb(
                  `complete:${student.uuid}:${student.streamId}:${student.currentStepId}`,
                ),
              },
            ],
            [
              {
                text: '📊 Мой прогресс',
                code: `progress:progress:${student.streamId}`,
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #handleComplete(action: string): Promise<BotResponse> {
    // Формат: complete:<studentId>:<streamId>:<stepId>
    const [, studentId, streamId, stepId] = action.split(':');

    const result = await this.moduleApi.execute('complete-step', {
      studentId,
      streamId,
      stepId,
    });

    // Если переход на новый урок/проект — получаем названия
    if (result.level === 'lesson' || result.level === 'project') {
      return this.#handleLevelTransition(result, streamId);
    }

    const levelMessages: Record<string, string> = {
      step: '✅ Шаг выполнен! Следующее задание уже ждёт.',
      stream:
        '🏆 *Поток полностью завершён!* Поздравляем с успешным окончанием обучения!',
    };

    return {
      sendMessage: {
        text: levelMessages[result.level] ?? '✅ Задание выполнено!',
        parseMode: 'MarkdownV2',
      },
    };
  }

  async #handleLevelTransition(
    result: {
      level: 'lesson' | 'project';
      completedLessonId?: string;
      completedProjectId?: string;
      currentStepId?: string;
    },
    streamId: string,
  ): Promise<BotResponse> {
    const stream = await this.moduleApi.execute('get-stream', { streamId });

    let messageText = '🎉 Отличная работа!';

    if (result.level === 'lesson' && result.completedLessonId) {
      // Находим название завершённого урока и следующего
      const completedTitle = this.#findLessonTitle(
        stream.contentSnapshot,
        result.completedLessonId,
      );
      const nextTitle = result.currentStepId
        ? this.#findLessonTitleByStep(
            stream.contentSnapshot,
            result.currentStepId,
          )
        : 'следующий урок';

      messageText = `🎉 Урок «${this.escapeMarkdown(completedTitle)}» завершён. Начинаем: «${this.escapeMarkdown(nextTitle)}»!`;
    } else if (result.level === 'project' && result.completedProjectId) {
      const completedTitle = this.#findProjectTitle(
        stream.contentSnapshot,
        result.completedProjectId,
      );
      const nextTitle = result.currentStepId
        ? this.#findProjectTitleByStep(
            stream.contentSnapshot,
            result.currentStepId,
          )
        : 'следующий проект';

      messageText = `🚀 Проект «${this.escapeMarkdown(completedTitle)}» завершён. Начинаем: «${this.escapeMarkdown(nextTitle)}»!`;
    }

    return {
      sendMessage: {
        text: messageText,
        parseMode: 'MarkdownV2',
      },
    };
  }

  #findStepLabel(
    snapshot: Array<{
      projectTitle: string;
      lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
    }>,
    stepId: string,
  ): string {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        const idx = lesson.stepIds.indexOf(stepId);
        if (idx !== -1) {
          return `Шаг ${idx + 1} / ${this.escapeMarkdown(lesson.lessonTitle)}`;
        }
      }
    }
    return `Шаг (${this.escapeMarkdown(stepId.slice(0, 8))}...)`;
  }

  #findLessonTitle(
    snapshot: Array<{
      projectTitle: string;
      lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
    }>,
    lessonId: string,
  ): string {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        if (lesson.stepIds.includes(lessonId)) {
          return lesson.lessonTitle;
        }
      }
    }
    return 'урок';
  }

  #findLessonTitleByStep(
    snapshot: Array<{
      projectTitle: string;
      lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
    }>,
    stepId: string,
  ): string {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        if (lesson.stepIds.includes(stepId)) {
          return lesson.lessonTitle;
        }
      }
    }
    return 'урок';
  }

  #findProjectTitle(
    snapshot: Array<{
      projectTitle: string;
      lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
    }>,
    projectId: string,
  ): string {
    for (const project of snapshot) {
      if (project.lessons.some((l) => l.stepIds.includes(projectId))) {
        return project.projectTitle;
      }
    }
    return 'проект';
  }

  #findProjectTitleByStep(
    snapshot: Array<{
      projectTitle: string;
      lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
    }>,
    stepId: string,
  ): string {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        if (lesson.stepIds.includes(stepId)) {
          return project.projectTitle;
        }
      }
    }
    return 'проект';
  }

}
