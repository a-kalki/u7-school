import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
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
        kind: 'callback',
        text: '📖 Моя учёба',
        action: this.cb('my-study'),
        priority: 20,
      };
    }
    return null;
  }

  override async handleHelpDescription(actor: User): Promise<string | null> {
    if (UserPolicy.isStudent(actor)) {
      return '📖 Моя учёба — доступ к твоим учебным материалам';
    }
    return null;
  }

  // ── Приватные методы ──

  async #handleMyStudy(actor: User): Promise<BotResponse> {
    const studentResult = await this.getStudent(actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

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

    const response = this.#buildStepKeyboard(
      stream,
      student.currentStepId,
      student.streamId,
    );

    // Добавляем кнопку «↩️ Главное меню» последней строкой
    if (response.sendMessage?.keyboard) {
      response.sendMessage.keyboard.rows.push([
        { text: '↩️ Главное меню', code: 'app:main-menu' },
      ]);
    }

    return response;
  }

  protected async getStudent(
    userId: string,
  ): Promise<{ ok: true; value: Student } | { ok: false; value: BotResponse }> {
    try {
      const user = await this.moduleApi.execute(
        'get-student-by-user',
        { userId },
        userId,
      );
      return {
        ok: true,
        value: user,
      };
    } catch (err) {
      this.handleError(err);
      return {
        ok: false,
        value: {
          sendMessage: {
            text: '📖 Вы не записаны ни на один поток',
            parseMode: 'MarkdownV2',
          },
        },
      };
    }
  }

  async #handleComplete(action: string, actor: User): Promise<BotResponse> {
    // Формат: complete:<streamId>:<stepId>
    const [, streamId, stepId] = action.split(':');
    if (!streamId || !stepId) {
      return this.sendUnknownError();
    }

    const studentResult = await this.getStudent(actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    // Сверяем streamId из callback с потоком студента
    if (student.streamId !== streamId) {
      return {
        sendMessage: {
          text: '⚠️ *Ошибка:* поток не соответствует вашему текущему обучению\\. Пожалуйста, используйте /start для обновления\\.',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const result = await this.moduleApi.execute(
      'complete-step',
      {
        studentId: student.uuid,
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
          keyboard: {
            rows: [[{ text: '↩️ Главное меню', code: 'app:main-menu' }]],
            isMultiple: false,
          },
        },
      };
    }

    // Переход на новый урок/проект — поздравление + кнопка
    if (result.level === 'lesson' || result.level === 'project') {
      return this.#handleLevelTransition(result, streamId);
    }

    // Обычный шаг — сразу показываем клавиатуру следующего шага
    const stream = await this.moduleApi.execute('get-stream', {
      streamId,
    });

    return this.#buildStepKeyboard(
      stream,
      result.currentStepId || stepId,
      streamId,
    );
  }

  /**
   * Строит клавиатуру шага с кнопками «Выполнено» и «Мой прогресс».
   */
  #buildStepKeyboard(
    stream: {
      title: string;
      contentSnapshot: ContentSnapshot;
    },
    stepId: string,
    streamId: string,
  ): BotResponse {
    const stepLabel = this.#findStepLabel(stream.contentSnapshot, stepId);

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
                code: this.cb('complete', streamId, stepId),
              },
            ],
            [
              {
                text: '📊 Мой прогресс',
                code: this.cbFor('progress', 'progress', streamId),
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
            [{ text: '↩️ Главное меню', code: 'app:main-menu' }],
          ],
          isMultiple: false,
        },
      },
    };
  }

  #findStepLabel(snapshot: ContentSnapshot, stepId: string): string {
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
