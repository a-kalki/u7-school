import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { md, mdJoin } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  KbButton,
  KeyboardDescription,
} from '@u7-scl/core/ui';
import type { ContentSnapshot, Step } from '@u7-scl/course/domain';
import type { Student } from '@u7-scl/stream/domain';
import { StreamDs } from '@u7-scl/stream/domain';
import { buttons } from '../../shared/buttons';
import {
  buildStepList,
  buildTransitionMessage,
  findLessonIdForStep,
  formatStepMessage,
  getCompletedStepsInOrder,
  getStudent,
  getStudentAndStream,
} from '../shared';

/**
 * Просмотр и прохождение шага (S05a).
 * Обрабатывает: продолжение, отметку о выполнении, просмотр пройденных шагов.
 *
 * Контракт «Диалог и Экран»: стори возвращает экраны (screen) — edit или
 * send решает транспорт (владеем экраном → edit на месте, drill-down
 * внутри стори не растит seq).
 */
export class StepViewStory extends U7BotUiStory {
  readonly name = 'step-view';

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (action === 'my-study:continue') {
      return this.#showCurrentStep(actor);
    }
    if (action.startsWith('complete:')) {
      return this.#handleComplete(action, actor);
    }
    if (action.startsWith('my-study:view:')) {
      const [, , streamId, stepId] = action.split(':');
      if (!streamId || !stepId) {
        return this.unknownCommand(action, actor, session);
      }
      return this.#showStepView(actor, streamId, stepId);
    }
    return this.unknownCommand(action, actor, session);
  }

  // ── Приватные методы: основной поток ──

  async #showCurrentStep(
    actor: User,
    _overrideStepId?: string,
  ): Promise<DialogResponse> {
    const studentResult = await getStudent(this.appApi, actor);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    if (
      student.status === 'advanced' ||
      student.status === 'not_advanced' ||
      student.status === 'abandoned'
    ) {
      return this.screen(
        md`🎉 *Поздравляю\\!* Вы завершили обучение в потоке\\!`,
      );
    }

    const stepId = _overrideStepId ?? student.currentStepId;

    const stream = await this.appApi.execute('get-stream', {
      streamId: student.streamId,
    });

    // Все шаги программы завершены, а итоговый статус ставит ментор —
    // показываем экран завершения потока вместо повторного рендера шага
    // (иначе повтор «Выполнено» даёт same-content edit и ошибку Telegram
    // «message is not modified»)
    const progress = StreamDs.computeProgress(
      (stream as { contentSnapshot: ContentSnapshot }).contentSnapshot,
      student,
    );
    if (progress.total > 0 && progress.completed >= progress.total) {
      return this.#streamCompletedScreen();
    }

    return this.#buildStepView(
      stream as { title: string; contentSnapshot: ContentSnapshot },
      stepId,
      student.streamId,
      student,
    );
  }

  async #handleComplete(action: string, actor: User): Promise<DialogResponse> {
    const [, streamId, stepId] = action.split(':');
    if (!streamId || !stepId) {
      return this.unknownCommand(action, actor);
    }

    const studentResult = await getStudent(this.appApi, actor);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    if (student.streamId !== streamId) {
      return this.screen(
        md`⚠️ *Ошибка:* поток не соответствует вашему текущему обучению\\. Пожалуйста, используйте /start для обновления\\.`,
      );
    }

    const result = (await this.appApi.execute(
      'complete-step',
      { studentId: student.uuid, streamId, stepId },
      actor,
    )) as {
      level: 'step' | 'lesson' | 'project' | 'stream' | 'already_completed';
      completedLessonId?: string;
      completedProjectId?: string;
      currentStepId?: string;
    };

    if (result.level === 'already_completed') {
      // Шаг уже был завершён ранее — просто показываем актуальный текущий шаг
      return this.#showCurrentStep(actor, result.currentStepId);
    }

    if (result.level === 'stream') {
      return this.#streamCompletedScreen();
    }

    if (result.level === 'lesson' || result.level === 'project') {
      // Перезагружаем студента — completeStep мутирует и сохраняет новое состояние
      const freshStudent = (await this.appApi.execute(
        'get-student-progress',
        { studentId: student.uuid },
        actor,
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
  ): Promise<DialogResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      const studentResult = await getStudent(this.appApi, actor);
      return studentResult.ok
        ? this.screen(md`⚠️ Поток не найден`)
        : studentResult.value;
    }

    if (student.streamId !== streamId) {
      return this.screen(
        md`⚠️ *Ошибка:* поток не соответствует вашему текущему обучению\\.`,
      );
    }

    const resolved = StreamDs.getStepPosition(stream.contentSnapshot, stepId);

    if (!resolved) {
      return this.screen(md`⚠️ Шаг не найден в программе потока\\.`);
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

    const fullText = stepList
      ? mdJoin([mainMessage, stepList], '\n\n')
      : mainMessage;

    // Кнопки
    const rows: KbButton[][] = [];

    if (isCompleted) {
      // ◀️/▶️ навигация
      const navRow: KbButton[] = [];
      const completedSteps = getCompletedStepsInOrder(student);
      const currentIdx = completedSteps.indexOf(stepId);
      const prevIndex = completedSteps[currentIdx - 1];
      const nextIndex = completedSteps[currentIdx + 1];

      if (currentIdx > 0 && prevIndex) {
        navRow.push(
          this.btn('◀️ Назад', this.cb('my-study:view', streamId, prevIndex)),
        );
      }
      if (currentIdx < completedSteps.length - 1 && nextIndex) {
        navRow.push(
          this.btn('▶️ Вперёд', this.cb('my-study:view', streamId, nextIndex)),
        );
      }
      if (navRow.length > 0) rows.push(navRow);

      rows.push([
        this.btn(
          '⬅️ Назад к уроку',
          lessonId
            ? this.cbFor('nav-tree', 'my-study:lesson', lessonId)
            : this.cbFor('nav-tree', 'my-study:lessons'),
        ),
      ]);
    } else {
      // Активный шаг
      rows.push([
        this.btn('✅ Выполнено', this.cb('complete', streamId, stepId)),
      ]);
    }

    rows.push([buttons.mainMenu()]);

    return this.screen(fullText, this.kb(rows));
  }

  // ── Приватные методы: сборка представления шага ──

  async #buildStepView(
    stream: { title: string; contentSnapshot: ContentSnapshot },
    stepId: string,
    streamId: string,
    student?: Student,
  ): Promise<DialogResponse> {
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

    return this.screen(message, keyboard);
  }

  #buildStepKeyboard(streamId: string, stepId: string): KeyboardDescription {
    return this.kb([
      [this.btn('✅ Выполнено', this.cb('complete', streamId, stepId))],
    ]);
  }

  /** Экран S05c «Завершение потока». */
  #streamCompletedScreen(): DialogResponse {
    return this.screen(
      md`🏆 *Поток полностью завершён\\!* Поздравляю с успешным окончанием обучения\\!`,
      this.kb([[buttons.mainMenu()]]),
    );
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
  ): Promise<DialogResponse> {
    const stream = (await this.appApi.execute('get-stream', {
      streamId,
    })) as { title: string; contentSnapshot: ContentSnapshot };

    const { messageText, buttonText } = buildTransitionMessage(
      result,
      stream,
      student,
    );

    return this.screen(
      messageText,
      this.kb([
        [this.btn(buttonText, this.cb('my-study:continue'))],
        [buttons.mainMenu()],
      ]),
    );
  }
}
