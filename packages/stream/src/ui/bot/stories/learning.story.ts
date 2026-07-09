import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import { safeConvert } from '@u7-scl/core/shared';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import type { ContentSnapshot, Step } from '@u7-scl/course/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import type { Student } from '#domain/index';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US-4: Прохождение обучения (активная фаза).
 * Показывает текущий шаг с телом, обрабатывает завершение шага.
 */
export class LearningStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'learning';

  // ── Публичные методы ──

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    if (action.startsWith('complete:')) {
      return this.#handleComplete(action, actor);
    }
    if (action === 'my-study') {
      return this.#showCurrentStep(actor);
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

  // ── Приватные методы: данные студента ──

  /**
   * Получает студента по actor.uuid.
   * Возвращает BotResponse при ошибке, чтобы стори могла ответить пользователю.
   */
  protected async getStudent(
    userId: string,
  ): Promise<{ ok: true; value: Student } | { ok: false; value: BotResponse }> {
    try {
      const user = await this.moduleApi.execute(
        'get-student-by-user',
        { userId },
        userId,
      );
      return { ok: true, value: user };
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

  // ── Приватные методы: основной поток ──

  /**
   * Показывает текущий шаг с телом и клавиатурой.
   * Вызывается из «Моя учёба» и из «Выполнено» (при level=step).
   *
   * @param actor — пользователь
   * @param _overrideStepId — если передан, используется вместо student.currentStepId
   *   (нужно после complete-step, пока студент не обновлён в БД)
   */
  async #showCurrentStep(
    actor: User,
    _overrideStepId?: string,
  ): Promise<BotResponse> {
    const studentResult = await this.getStudent(actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    if (
      student.status === 'advanced' ||
      student.status === 'not_advanced' ||
      student.status === 'abandoned'
    ) {
      return {
        sendMessage: {
          text: '🎉 *Поздравляем\\!* Вы завершили обучение в потоке\\!',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const stepId = _overrideStepId ?? student.currentStepId;

    const stream = await this.moduleApi.execute('get-stream', {
      streamId: student.streamId,
    });

    return this.#buildStepView(stream, stepId, student.streamId);
  }

  async #handleComplete(action: string, actor: User): Promise<BotResponse> {
    const [, streamId, stepId] = action.split(':');
    if (!streamId || !stepId) {
      return this.sendUnknownError();
    }

    const studentResult = await this.getStudent(actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

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
      { studentId: student.uuid, streamId, stepId },
      actor.uuid,
    );

    // Завершение потока
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
      return this.#announceTransition(result, streamId);
    }

    // Обычный шаг — сразу показываем клавиатуру следующего шага
    return this.#showCurrentStep(actor, result.currentStepId);
  }

  // ── Приватные методы: сборка представления шага ──

  /**
   * Собирает полное представление шага: тело + позиция + клавиатура.
   * Единственное место, где происходит форматирование сообщения шага.
   */
  async #buildStepView(
    stream: { title: string; contentSnapshot: ContentSnapshot },
    stepId: string,
    streamId: string,
  ): Promise<BotResponse> {
    // Резолвим позицию через UC resolve-content-path (по stepId)
    let resolved:
      | {
          projectTitle?: string;
          projectIndex?: number;
          lessonTitle?: string;
          lessonIndex?: number;
          steps?: unknown[];
        }
      | undefined;
    try {
      resolved = (await this.appApi.execute('resolve-content-path', {
        stepId,
        courseId: 'default',
      })) as typeof resolved;
    } catch {
      // Если резолв не удался — заполняем заглушками
    }

    const step = await this.appApi.execute('get-step', { uuid: stepId });
    const message = this.#formatStepMessage(stream.title, resolved, step);
    const keyboard = this.#buildStepKeyboard(streamId, stepId);

    // Добавляем кнопку «↩️ Главное меню» последней строкой
    keyboard.rows.push([{ text: '↩️ Главное меню', code: 'app:main-menu' }]);

    return {
      sendMessage: {
        text: message,
        parseMode: 'MarkdownV2',
        keyboard,
      },
    };
  }

  /** Форматирует сообщение шага: заголовок, разделитель, тело. */
  #formatStepMessage(
    streamTitle: string,
    resolved:
      | {
          projectTitle?: string;
          projectIndex?: number;
          lessonTitle?: string;
          lessonIndex?: number;
          steps?: unknown[];
          step?: unknown;
        }
      | undefined,
    step: Step,
  ): string {
    const esc = this.escapeMarkdown;
    const pIdx = resolved?.projectIndex ?? 0;
    const lIdx = resolved?.lessonIndex ?? 0;
    const sIdx = (resolved as { stepIndex?: number })?.stepIndex ?? 1;
    const totalSteps = resolved?.steps?.length ?? 1;
    const lines: string[] = [
      `📖 *Поток:* ${esc(streamTitle)}`,
      `📁 *Проект:* ${esc(resolved?.projectTitle || '(неизвестный проект)')}`,
      `📚 *Урок:* «${esc(resolved?.lessonTitle || '(неизвестный урок)')}»`,
      `🔢 p${pIdx}\\-l${lIdx}`,
      '',
      '――――――――――――――',
      '',
      `📝 *Шаг ${sIdx} из ${totalSteps}:* ${esc(step.description)}`,
    ];

    if (step.kind === 'code' && step.code) {
      lines.push('', '```', step.code, '```');
    } else if (step.kind === 'text' && step.content) {
      lines.push('', safeConvert(step.content));
    }

    return lines.join('\n');
  }

  /** Чистая клавиатура: [✅ Выполнено] [📊 Мой прогресс] (без «Главное меню»). */
  #buildStepKeyboard(streamId: string, stepId: string) {
    return {
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
    };
  }

  // ── Приватные методы: переходы ──

  async #announceTransition(
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
            [{ text: buttonText, code: this.cb('my-study') }],
            [{ text: '↩️ Главное меню', code: 'app:main-menu' }],
          ],
          isMultiple: false,
        },
      },
    };
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
