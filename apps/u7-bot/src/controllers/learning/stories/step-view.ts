import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';
import type { ContentSnapshot, Step } from '@u7-scl/course/domain';
import type { Student } from '@u7-scl/stream/domain';
import { StreamDs } from '@u7-scl/stream/domain';
import { buttons } from '../../shared/buttons';
import {
  buildStepList,
  buildTransitionMessage,
  editOrSend,
  findLessonIdForStep,
  formatStepMessage,
  getCompletedStepsInOrder,
  getStudent,
  getStudentAndStream,
  respondInContext,
} from '../shared';

/**
 * Просмотр и прохождение шага (S05a).
 * Обрабатывает: продолжение, отметку о выполнении, просмотр пройденных шагов.
 */
export class StepViewStory extends U7BotUserStory {
  readonly name = 'step-view';

  async handleCallback(
    action: string,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    if (action === 'my-study:continue') {
      return this.#showCurrentStep(actor);
    }
    if (action.startsWith('complete:')) {
      return this.#handleComplete(action, actor);
    }
    if (action.startsWith('my-study:view:')) {
      const [, , streamId, stepId] = action.split(':');
      if (!streamId || !stepId) {
        return { sendMessage: { text: '⚠️ Неверный формат команды' } };
      }
      return this.#showStepView(actor, streamId, stepId, session);
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

  // ── Приватные методы: основной поток ──

  async #showCurrentStep(
    actor: User,
    _overrideStepId?: string,
  ): Promise<BotResponse> {
    const studentResult = await getStudent(this.appApi, actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    if (
      student.status === 'advanced' ||
      student.status === 'not_advanced' ||
      student.status === 'abandoned'
    ) {
      return {
        sendMessage: {
          text: '🎉 *Поздравляю\\!* Вы завершили обучение в потоке\\!',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const stepId = _overrideStepId ?? student.currentStepId;

    const stream = await this.appApi.execute('get-stream', {
      streamId: student.streamId,
    });

    return this.#buildStepView(
      stream as { title: string; contentSnapshot: ContentSnapshot },
      stepId,
      student.streamId,
      student,
    );
  }

  async #handleComplete(action: string, actor: User): Promise<BotResponse> {
    const [, streamId, stepId] = action.split(':');
    if (!streamId || !stepId) {
      return this.sendUnknownError();
    }

    const studentResult = await getStudent(this.appApi, actor.uuid);
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

    const result = (await this.appApi.execute(
      'complete-step',
      { studentId: student.uuid, streamId, stepId },
      actor.uuid,
    )) as {
      level: 'step' | 'lesson' | 'project' | 'stream';
      completedLessonId?: string;
      completedProjectId?: string;
      currentStepId?: string;
    };

    if (result.level === 'stream') {
      return {
        sendMessage: {
          text: '🏆 *Поток полностью завершён\\!* Поздравляю с успешным окончанием обучения\\!',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [[buttons.mainMenu()]],
            isMultiple: false,
          },
        },
      };
    }

    if (result.level === 'lesson' || result.level === 'project') {
      // Перезагружаем студента — completeStep мутирует и сохраняет новое состояние
      const freshStudent = (await this.appApi.execute(
        'get-student-progress',
        { studentId: student.uuid },
        actor.uuid,
      )) as Student;
      return this.#announceTransition(
        result as {
          level: 'lesson' | 'project';
          completedLessonId?: string;
          completedProjectId?: string;
          currentStepId?: string;
        },
        streamId,
        freshStudent,
      );
    }

    return this.#showCurrentStep(actor, result.currentStepId);
  }

  // ── Приватные методы: просмотр шага ──

  /** Просмотр завершённого шага с ◀️/▶️ навигацией. */
  async #showStepView(
    actor: User,
    streamId: string,
    stepId: string,
    session: SessionData,
  ): Promise<BotResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      const studentResult = await getStudent(this.appApi, actor.uuid);
      return studentResult.ok
        ? { sendMessage: { text: '⚠️ Поток не найден' } }
        : studentResult.value;
    }

    if (student.streamId !== streamId) {
      return editOrSend(
        {
          sendMessage: {
            text: '⚠️ *Ошибка:* поток не соответствует вашему текущему обучению.',
            parseMode: 'MarkdownV2',
          },
        },
        session,
      );
    }

    const resolved = StreamDs.getStepPosition(stream.contentSnapshot, stepId);

    if (!resolved) {
      return editOrSend(
        {
          sendMessage: {
            text: '⚠️ Шаг не найден в программе потока.',
            parseMode: 'MarkdownV2',
          },
        },
        session,
      );
    }

    const step = await this.appApi.execute('get-step', { uuid: stepId });
    const stepRecord = student.steps.find((s) => s.stepId === stepId);
    const isCompleted = stepRecord?.status === 'completed';

    // Основное сообщение шага
    const mainMessage = formatStepMessage(
      stream.title,
      resolved,
      step as Step,
      stream.contentSnapshot,
      student,
    );

    // Список шагов урока
    const lessonId = findLessonIdForStep(stream.contentSnapshot, stepId);
    const stepList = lessonId
      ? await buildStepList(
          this.appApi,
          stream.contentSnapshot,
          lessonId,
          student,
        )
      : '';

    const fullText = [mainMessage, '', stepList].join('\n');

    // Кнопки
    const rows: Array<Array<{ text: string; code: string }>> = [];

    if (isCompleted) {
      // ◀️/▶️ навигация
      const navRow: Array<{ text: string; code: string }> = [];
      const completedSteps = getCompletedStepsInOrder(student);
      const currentIdx = completedSteps.indexOf(stepId);
      const prevIndex = completedSteps[currentIdx - 1];
      const nextIndex = completedSteps[currentIdx + 1];

      if (currentIdx > 0 && prevIndex) {
        navRow.push({
          text: '◀️ Назад',
          code: this.cb('my-study:view', streamId, prevIndex),
        });
      }
      if (currentIdx < completedSteps.length - 1 && nextIndex) {
        navRow.push({
          text: '▶️ Вперёд',
          code: this.cb('my-study:view', streamId, nextIndex),
        });
      }
      if (navRow.length > 0) rows.push(navRow);

      rows.push([
        {
          text: '⬅️ Назад к уроку',
          code: lessonId
            ? this.cbFor('nav-tree', 'my-study:lesson', lessonId)
            : this.cbFor('nav-tree', 'my-study:lessons'),
        },
      ]);
    } else {
      // Активный шаг
      rows.push([
        {
          text: '✅ Выполнено',
          code: this.cb('complete', streamId, stepId),
        },
      ]);
    }

    rows.push([buttons.mainMenu()]);

    const description: BotResponse = {
      sendMessage: {
        text: fullText,
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };

    return respondInContext(description, session);
  }

  // ── Приватные методы: сборка представления шага ──

  async #buildStepView(
    stream: { title: string; contentSnapshot: ContentSnapshot },
    stepId: string,
    streamId: string,
    student?: Student,
  ): Promise<BotResponse> {
    const resolved = StreamDs.getStepPosition(stream.contentSnapshot, stepId);

    const step = await this.appApi.execute('get-step', { uuid: stepId });
    const message = formatStepMessage(
      stream.title,
      resolved,
      step as Step,
      stream.contentSnapshot,
      student,
    );
    const keyboard = this.#buildStepKeyboard(streamId, stepId);

    keyboard.rows.push([buttons.mainMenu()]);

    return {
      sendMessage: {
        text: message,
        parseMode: 'MarkdownV2',
        keyboard,
      },
    };
  }

  #buildStepKeyboard(streamId: string, stepId: string) {
    return {
      rows: [
        [
          {
            text: '✅ Выполнено',
            code: this.cb('complete', streamId, stepId),
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
    student: Student,
  ): Promise<BotResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as { title: string; contentSnapshot: ContentSnapshot };

    const { messageText, buttonText } = buildTransitionMessage(
      result,
      stream,
      student,
    );

    return {
      sendMessage: {
        text: messageText,
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [{ text: buttonText, code: this.cb('my-study:continue') }],
            [buttons.mainMenu()],
          ],
          isMultiple: false,
        },
      },
    };
  }
}
