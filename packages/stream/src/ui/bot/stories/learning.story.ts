import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { UserPolicy } from '@u7-scl/user/domain';
import type { Student } from '#domain/index';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US-4: Прохождение обучения (активная фаза).
 * Показывает текущий шаг, обрабатывает завершение шага.
 */
export class LearningStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'learning';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    // Завершение шага: complete:<studentId>:<streamId>:<stepId>
    if (action.startsWith('complete:')) {
      return this.#handleComplete(action, actor);
    }

    // Показ текущего шага
    if (action === 'my-study') {
      return this.#handleMyStudy(actor);
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

  override async handleStart(actor: User): Promise<MainMenuAction | null> {
    if (UserPolicy.isStudent(actor)) {
      return {
        text: '📖 Моя учёба',
        action: this.cb('my-study'),
        priority: 20,
      };
    }
    return null;
  }

  // ── Приватные методы ──

  async #handleMyStudy(actor: User): Promise<BotResponse> {
    let student: Student;
    try {
      student = await this.moduleApi.execute(
        'get-student-by-user',
        {
          userId: actor.uuid,
        },
        actor.uuid,
      );
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
          text: '🎉 *Поздравляем\\!* Вы завершили обучение в потоке\\!',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const stream = await this.moduleApi.execute('get-stream', {
      streamId: student.streamId,
    });

    return this.#buildStepKeyboard(
      student,
      stream,
      student.currentStepId,
    );
  }

  async #handleComplete(action: string, actor: User): Promise<BotResponse> {
    // Формат: complete:<studentId>:<streamId>:<stepId>
    const [, studentId, streamId, stepId] = action.split(':');
    if (!studentId || !streamId || !stepId) {
      return this.sendUnknownError();
    }

    const result = await this.moduleApi.execute(
      'complete-step',
      {
        studentId,
        streamId,
        stepId,
      },
      actor.uuid,
    );

    // Завершение потока — сохраняем текущее поведение
    if (result.level === 'stream') {
      return {
        sendMessage: {
          text: '🏆 *Поток полностью завершён\\!* Поздравляем с успешным окончанием обучения\\!',
          parseMode: 'MarkdownV2',
        },
      };
    }

    // Переход на новый урок/проект — поздравление + кнопка
    if (result.level === 'lesson' || result.level === 'project') {
      return this.#handleLevelTransition(result, streamId);
    }

    // Обычный шаг — сразу показываем клавиатуру следующего шага
    const student = await this.moduleApi.execute(
      'get-student-by-user',
      { userId: actor.uuid },
      actor.uuid,
    );

    const stream = await this.moduleApi.execute('get-stream', {
      streamId,
    });

    return this.#buildStepKeyboard(
      student,
      stream,
      result.currentStepId || stepId,
    );
  }

  /**
   * Строит клавиатуру шага с кнопками «Выполнено» и «Мой прогресс».
   */
  #buildStepKeyboard(
    student: Student,
    stream: { title: string; contentSnapshot: Array<{
      projectTitle: string;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        stepIds: string[];
      }>;
    }> },
    stepId: string,
  ): BotResponse {
    const stepLabel = this.#findStepLabel(
      stream.contentSnapshot,
      stepId,
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
                  'complete',
                  student.uuid,
                  student.streamId,
                  stepId,
                ),
              },
            ],
            [
              {
                text: '📊 Мой прогресс',
                code: this.cbFor('progress', 'progress', student.streamId),
              },
            ],
          ],
          isMultiple: false,
        },
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

    let messageText: string;
    let buttonText: string;

    if (result.level === 'lesson' && result.completedLessonId) {
      const completedTitle = this.#findLessonTitle(
        stream.contentSnapshot,
        result.completedLessonId,
      );
      messageText = `🎉 Урок «${this.escapeMarkdown(completedTitle)}» завершён\\!`;
      buttonText = '▶️ Начать следующий урок';
    } else if (result.level === 'project' && result.completedProjectId) {
      const completedTitle = this.#findProjectTitle(
        stream.contentSnapshot,
        result.completedProjectId,
      );
      messageText = `🚀 Проект «${this.escapeMarkdown(completedTitle)}» завершён\\!`;
      buttonText = '▶️ Начать следующий проект';
    } else {
      messageText = '🎉 Отличная работа!';
      buttonText = '▶️ Продолжить';
    }

    return {
      sendMessage: {
        text: messageText,
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: buttonText,
                code: this.cb('my-study'),
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  #findStepLabel(
    snapshot: Array<{
      projectTitle: string;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        stepIds: string[];
      }>;
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
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        stepIds: string[];
      }>;
    }>,
    lessonId: string,
  ): string {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        if (lesson.lessonId === lessonId) {
          return lesson.lessonTitle;
        }
      }
    }
    return 'урок';
  }

  #findProjectTitle(
    snapshot: Array<{
      projectId: string;
      projectTitle: string;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        stepIds: string[];
      }>;
    }>,
    projectId: string,
  ): string {
    for (const project of snapshot) {
      if (project.projectId === projectId) {
        return project.projectTitle;
      }
    }
    return 'проект';
  }
}
