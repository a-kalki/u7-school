import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import { safeConvert } from '@u7-scl/core/shared';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import {
  type ContentSnapshot,
  CourseDs,
  type Step,
  type StepPosition,
} from '@u7-scl/course/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import type { Student } from '#domain/index';
import { StreamDs } from '#domain/index';
import type { StreamApiModuleMeta } from '../../../domain/module';

/**
 * US-4: Прохождение обучения (активная фаза).
 * Показывает хаб «Моя учёба», текущий шаг с телом, обрабатывает завершение шага.
 */
export class LearningStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'learning';

  // ── Публичные методы ──

  async handleCallback(
    action: string,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    if (action.startsWith('complete:')) {
      return this.#handleComplete(action, actor);
    }
    if (action === 'my-study') {
      return this.#showHub(actor);
    }
    if (action === 'my-study:continue') {
      return this.#showCurrentStep(actor);
    }
    if (action === 'my-study:leave-confirm') {
      return this.#showLeaveConfirm(actor);
    }
    if (action === 'my-study:leave') {
      return this.#executeLeave(actor);
    }
    if (action === 'my-study:lessons') {
      return this.#showProjects(actor, session);
    }
    if (action.startsWith('my-study:project:')) {
      const projectIndex = Number.parseInt(action.split(':')[2] ?? '0', 10);
      return this.#showLessons(actor, projectIndex, session);
    }
    if (action.startsWith('my-study:lesson:')) {
      const lessonId = action.split(':').slice(2).join(':');
      return this.#showSteps(actor, lessonId, session);
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

  // ── Приватные методы: хаб ──

  /** Показывает хаб «Моя учёба» с кнопками действий. */
  async #showHub(actor: User): Promise<BotResponse> {
    const studentResult = await this.getStudent(actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;
    const isFinished =
      student.status === 'advanced' ||
      student.status === 'not_advanced' ||
      student.status === 'abandoned';

    const rows: Array<Array<{ text: string; code: string }>> = [];

    if (!isFinished) {
      rows.push([{ text: '▶️ Продолжить', code: this.cb('my-study:continue') }]);
      rows.push([{ text: '📂 Уроки', code: this.cb('my-study:lessons') }]);
    }

    rows.push([
      {
        text: '📊 Мой прогресс',
        code: this.cbFor('progress', 'progress', student.streamId),
      },
    ]);
    rows.push([
      { text: '🚪 Покинуть поток', code: this.cb('my-study:leave-confirm') },
    ]);
    rows.push([{ text: '↩️ Главное меню', code: 'app:main-menu' }]);

    return {
      sendMessage: {
        text: '📖 *Моя учёба*\n\nВыберите действие:',
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ── Приватные методы: основной поток ──

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

    if (result.level === 'lesson' || result.level === 'project') {
      return this.#announceTransition(result, streamId, student);
    }

    return this.#showCurrentStep(actor, result.currentStepId);
  }

  // ── Приватные методы: выход из потока ──

  async #showLeaveConfirm(actor: User): Promise<BotResponse> {
    const studentResult = await this.getStudent(actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    return {
      sendMessage: {
        text: '🚪 *Покинуть поток?*\n\nВы уверены, что хотите покинуть поток? Это действие нельзя отменить\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              { text: '🚪 Да, покинуть', code: this.cb('my-study:leave') },
              { text: '❌ Отмена', code: this.cb('my-study') },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #executeLeave(actor: User): Promise<BotResponse> {
    const studentResult = await this.getStudent(actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    try {
      await this.moduleApi.execute(
        'drop-student',
        { streamId: student.streamId, studentId: student.uuid },
        actor.uuid,
      );
    } catch (err) {
      return this.handleError(err);
    }

    return {
      sendMessage: {
        text: '👋 Вы покинули поток\\. Если захотите вернуться — обратитесь к ментору\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [[{ text: '↩️ Главное меню', code: 'app:main-menu' }]],
          isMultiple: false,
        },
      },
    };
  }

  // ── Приватные методы: дерево навигации «📂 Уроки» ──

  /** Уровень 1: список проектов с прогрессом. */
  async #showProjects(actor: User, session: SessionData): Promise<BotResponse> {
    const { student, stream } = await this.#getStudentAndStream(actor);
    if (!student || !stream) return student as BotResponse;

    const tree = StreamDs.buildNavigationTree(stream.contentSnapshot, student);

    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (let pi = 0; pi < tree.projects.length; pi++) {
      const p = tree.projects[pi];
      if (!p) continue;

      rows.push([
        {
          text: `📁 ${p.title} (${p.completedLessons}/${p.totalLessons})`,
          code: this.cb('my-study:project', String(pi + 1)),
        },
      ]);
    }

    rows.push([{ text: '⬅️ Назад к учёбе', code: this.cb('my-study') }]);

    const description: BotResponse = {
      sendMessage: {
        text: '📂 *Уроки*\n\nВыберите проект:',
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };

    return this.#respondInContext(description, session);
  }

  /** Уровень 2: уроки проекта. */
  async #showLessons(
    actor: User,
    projectIndex: number,
    session: SessionData,
  ): Promise<BotResponse> {
    const { student, stream } = await this.#getStudentAndStream(actor);
    if (!student || !stream) return student as BotResponse;

    const tree = StreamDs.buildNavigationTree(stream.contentSnapshot, student);

    const project = tree.projects[projectIndex - 1];
    if (!project) {
      return this.#editOrSend(
        { sendMessage: { text: '⚠️ Проект не найден' } },
        session,
      );
    }

    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const lesson of project.lessons) {
      rows.push([
        {
          text: `📝 ${lesson.title} (${lesson.completedSteps}/${lesson.totalSteps})`,
          code: this.cb('my-study:lesson', lesson.lessonId),
        },
      ]);
    }

    rows.push([
      { text: '⬅️ Назад к проектам', code: this.cb('my-study:lessons') },
    ]);

    const description: BotResponse = {
      sendMessage: {
        text: `📂 *Уроки* › ${this.escapeMarkdown(project.title)}\n\nВыберите урок:`,
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };

    return this.#respondInContext(description, session);
  }

  /** Уровень 3: шаги урока с маркерами ✅/▶️/🔒. */
  async #showSteps(
    actor: User,
    lessonId: string,
    session: SessionData,
  ): Promise<BotResponse> {
    const { student, stream } = await this.#getStudentAndStream(actor);
    if (!student || !stream) return student as BotResponse;

    const view = StreamDs.buildLessonSteps(
      stream.contentSnapshot,
      lessonId,
      student,
    );

    if (!view) {
      return this.#editOrSend(
        { sendMessage: { text: '⚠️ Урок не найден' } },
        session,
      );
    }

    // Собираем описания шагов
    const stepsWithDesc: Array<{
      stepId: string;
      description: string;
      marker: string;
    }> = [];

    for (const s of view.steps) {
      let marker: string;
      if (s.status === 'completed') {
        marker = '✅';
      } else if (s.status === 'current') {
        marker = '▶️';
      } else {
        marker = '🔒';
      }

      // Получаем описание шага (только заголовок)
      let description = '';
      try {
        const step = await this.appApi.execute('get-step', { uuid: s.stepId });
        description = (step as { description?: string }).description ?? '';
      } catch {
        description = '';
      }

      stepsWithDesc.push({ stepId: s.stepId, description, marker });
    }

    const esc = this.escapeMarkdown;
    const lines: string[] = [
      `📂 *Уроки* › ${esc(view.projectTitle)} › ${esc(view.lessonTitle)}`,
      '',
    ];

    for (const s of stepsWithDesc) {
      lines.push(`${s.marker} _${esc(s.description || s.stepId)}_`);
    }

    lines.push('', 'Выберите шаг:');

    // Кнопки: только доступные шаги
    const rows: Array<Array<{ text: string; code: string }>> = [];

    for (const s of stepsWithDesc) {
      if (s.marker === '🔒') continue;
      rows.push([
        {
          text: `${s.marker} ${s.description || s.stepId}`,
          code:
            s.marker === '✅'
              ? this.cb('my-study:view', student.streamId, s.stepId)
              : this.cb('my-study:continue'),
        },
      ]);
    }

    rows.push([
      {
        text: '⬅️ Назад к урокам',
        code: this.cb('my-study:project', String(view.projectIndex)),
      },
    ]);

    const description: BotResponse = {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };

    return this.#respondInContext(description, session);
  }

  /** Уровень 4: просмотр шага (read-only для completed, active для текущего). */
  async #showStepView(
    actor: User,
    streamId: string,
    stepId: string,
    session: SessionData,
  ): Promise<BotResponse> {
    const { student, stream } = await this.#getStudentAndStream(actor);
    if (!student || !stream) return student as BotResponse;

    if (student.streamId !== streamId) {
      return this.#editOrSend(
        {
          sendMessage: {
            text: '⚠️ *Ошибка:* поток не соответствует вашему текущему обучению.',
            parseMode: 'MarkdownV2',
          },
        },
        session,
      );
    }

    const ds = new CourseDs();
    const resolved = ds.findStepPosition(stream.contentSnapshot, stepId);

    if (!resolved) {
      return this.#editOrSend(
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
    const mainMessage = this.#formatStepMessage(
      stream.title,
      resolved,
      step as Step,
    );

    // Список шагов урока
    const lessonId = this.#findLessonIdForStep(stream.contentSnapshot, stepId);
    const stepList = lessonId
      ? await this.#buildStepList(stream.contentSnapshot, lessonId, student)
      : '';

    const fullText = [mainMessage, '', stepList].join('\n');

    // Кнопки
    const rows: Array<Array<{ text: string; code: string }>> = [];

    if (isCompleted) {
      // ◀️/▶️ навигация
      const navRow: Array<{ text: string; code: string }> = [];
      const completedSteps = this.#getCompletedStepsInOrder(
        student,
        stream.contentSnapshot,
      );
      const currentIdx = completedSteps.indexOf(stepId);

      if (currentIdx > 0) {
        navRow.push({
          text: '◀️ Назад',
          code: this.cb(
            'my-study:view',
            streamId,
            completedSteps[currentIdx - 1]!,
          ),
        });
      }
      if (currentIdx < completedSteps.length - 1) {
        navRow.push({
          text: '▶️ Вперёд',
          code: this.cb(
            'my-study:view',
            streamId,
            completedSteps[currentIdx + 1]!,
          ),
        });
      }
      if (navRow.length > 0) rows.push(navRow);

      rows.push([
        {
          text: '⬅️ Назад к уроку',
          code: lessonId
            ? this.cb('my-study:lesson', lessonId)
            : this.cb('my-study:lessons'),
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
      rows.push([
        {
          text: '📊 Мой прогресс',
          code: this.cbFor('progress', 'progress', streamId),
        },
      ]);
    }

    rows.push([{ text: '↩️ Главное меню', code: 'app:main-menu' }]);

    const description: BotResponse = {
      sendMessage: {
        text: fullText,
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };

    return this.#respondInContext(description, session);
  }

  // ── Вспомогательные методы дерева ──

  /**
   * Получает студента и поток. Возвращает ошибку как BotResponse при неудаче.
   */
  async #getStudentAndStream(actor: User): Promise<{
    student: Student | null;
    stream: { title: string; contentSnapshot: ContentSnapshot } | null;
  }> {
    const studentResult = await this.getStudent(actor.uuid);
    if (!studentResult.ok) return { student: null, stream: null };

    const student = studentResult.value;

    try {
      const stream = await this.moduleApi.execute('get-stream', {
        streamId: student.streamId,
      });
      return { student, stream };
    } catch {
      return { student: null, stream: null };
    }
  }

  /**
   * Если в сессии есть lastBotMessage — редактируем его (editMessage).
   * Иначе — отправляем новое (sendMessage).
   */
  #respondInContext(response: BotResponse, session: SessionData): BotResponse {
    const lastMsg = session.lastBotMessage;
    if (lastMsg && response.sendMessage) {
      return {
        editMessage: {
          messageId: lastMsg.messageId,
          text: response.sendMessage.text,
          keyboard: response.sendMessage.keyboard,
          parseMode: response.sendMessage.parseMode,
        },
      };
    }
    return response;
  }

  /** Хелпер для editMessage или sendMessage в зависимости от сессии. */
  #editOrSend(response: BotResponse, session: SessionData): BotResponse {
    const lastMsg = session.lastBotMessage;
    if (lastMsg && response.sendMessage) {
      return {
        editMessage: {
          messageId: lastMsg.messageId,
          text: response.sendMessage.text,
          keyboard: response.sendMessage.keyboard,
          parseMode: response.sendMessage.parseMode,
        },
      };
    }
    return response;
  }

  /** Находит lessonId для шага в снапшоте. */
  #findLessonIdForStep(
    snapshot: ContentSnapshot,
    stepId: string,
  ): string | null {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        if (lesson.stepIds.includes(stepId)) {
          return lesson.lessonId;
        }
      }
    }
    return null;
  }

  /** Список completed шагов в порядке прохождения. */
  #getCompletedStepsInOrder(
    student: Student,
    _snapshot: ContentSnapshot,
  ): string[] {
    return student.steps
      .filter((s) => s.status === 'completed')
      .map((s) => s.stepId);
  }

  /** Строит список шагов урока с маркерами для отображения в просмотре шага. */
  async #buildStepList(
    snapshot: ContentSnapshot,
    lessonId: string,
    student: Student,
  ): Promise<string> {
    const stepStatuses = new Map<string, 'completed' | 'issued'>();
    for (const sr of student.steps) {
      stepStatuses.set(sr.stepId, sr.status as 'completed' | 'issued');
    }

    // Найти stepIds урока
    let stepIds: string[] = [];
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        if (lesson.lessonId === lessonId) {
          stepIds = lesson.stepIds;
          break;
        }
      }
      if (stepIds.length > 0) break;
    }

    if (stepIds.length === 0) return '';

    const esc = this.escapeMarkdown;
    const lines: string[] = ['_Шаги урока:_'];

    for (const sid of stepIds) {
      const status = stepStatuses.get(sid);
      let marker: string;
      if (status === 'completed') {
        marker = '✅';
      } else if (status === 'issued') {
        marker = '▶️';
      } else {
        marker = '🔒';
      }

      let desc = '';
      try {
        const step = await this.appApi.execute('get-step', { uuid: sid });
        desc = (step as { description?: string }).description ?? sid;
      } catch {
        desc = sid;
      }

      lines.push(`${marker} _${esc(desc)}_`);
    }

    return lines.join('\n');
  }

  // ── Приватные методы: сборка представления шага ──

  async #buildStepView(
    stream: { title: string; contentSnapshot: ContentSnapshot },
    stepId: string,
    streamId: string,
  ): Promise<BotResponse> {
    const ds = new CourseDs();
    const resolved = ds.findStepPosition(stream.contentSnapshot, stepId);

    const step = await this.appApi.execute('get-step', { uuid: stepId });
    const message = this.#formatStepMessage(stream.title, resolved, step);
    const keyboard = this.#buildStepKeyboard(streamId, stepId);

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
    resolved: StepPosition | null,
    step: Step,
  ): string {
    const esc = this.escapeMarkdown;
    const pIdx = resolved?.projectIndex ?? 0;
    const lIdx = resolved?.lessonIndex ?? 0;
    const sIdx = resolved?.stepIndex ?? 1;
    const totalSteps = resolved?.totalSteps ?? 1;
    const lines: string[] = [
      `📖 *Поток:* ${esc(streamTitle)}`,
      `📁 *Проект:* ${esc(resolved?.projectTitle || '(неизвестный проект)')}`,
      `📚 *Урок:* «${esc(resolved?.lessonTitle || '(неизвестный урок)')}»`,
      `🔢 p${pIdx}\\-l${lIdx}`,
      '',
      '――――――――――――――',
      '',
      `📊 ${this.formatProgressBar(sIdx, totalSteps)}`,
      `📝 *Шаг ${sIdx} из ${totalSteps}:* ${esc(step.description)}`,
    ];

    if (step.kind === 'code' && step.code) {
      lines.push('', '```', step.code, '```');
    } else if (step.kind === 'text' && step.content) {
      lines.push('', safeConvert(step.content));
    }

    return lines.join('\n');
  }

  /** Формирует прогресс-бар: [██████░░░░] X/Y (10 блоков). */
  formatProgressBar(current: number, total: number): string {
    const width = 10;
    const filled = total === 0 ? 0 : Math.round((current / total) * width);
    const empty = width - filled;
    const block = '█'.repeat(filled) + '░'.repeat(empty);
    return `\\[${block}\\] ${current}/${total}`;
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
    student: Student,
  ): Promise<BotResponse> {
    const stream = await this.moduleApi.execute('get-stream', { streamId });
    const ds = new CourseDs();

    let messageText: string;
    let buttonText: string;
    let progressLine = '';

    if (result.level === 'lesson' && result.completedLessonId) {
      const completedTitle = ds.findLessonTitle(
        stream.contentSnapshot,
        result.completedLessonId,
      );
      messageText = `🎉 Урок «${this.escapeMarkdown(completedTitle)}» завершён\\!`;
      buttonText = '▶️ Начать следующий урок';

      // Прогресс проекта
      for (const project of stream.contentSnapshot) {
        for (const lesson of project.lessons) {
          if (lesson.lessonId === result.completedLessonId) {
            const completed = project.lessons.filter((l) =>
              l.stepIds.every((s) =>
                student.steps.some(
                  (sr) => sr.stepId === s && sr.status === 'completed',
                ),
              ),
            ).length;
            const total = project.lessons.length;
            progressLine = `\\n📊 ${this.formatProgressBar(completed, total)} — «${this.escapeMarkdown(project.projectTitle)}»`;
            break;
          }
        }
        if (progressLine) break;
      }
    } else if (result.level === 'project' && result.completedProjectId) {
      const completedTitle = ds.findProjectTitle(
        stream.contentSnapshot,
        result.completedProjectId,
      );
      messageText = `🚀 Проект «${this.escapeMarkdown(completedTitle)}» завершён\\!`;
      buttonText = '▶️ Начать следующий проект';

      // Прогресс потока: считаем завершённые проекты
      const completed = stream.contentSnapshot.filter((p) =>
        p.lessons.every((l) =>
          l.stepIds.every((s) =>
            student.steps.some(
              (sr) => sr.stepId === s && sr.status === 'completed',
            ),
          ),
        ),
      ).length;
      const total = stream.contentSnapshot.length;
      progressLine = `\\n📊 ${this.formatProgressBar(completed, total)} — «${this.escapeMarkdown(stream.title)}»`;
    } else {
      messageText = '🎉 Отличная работа!';
      buttonText = '▶️ Продолжить';
    }

    messageText += progressLine;

    return {
      sendMessage: {
        text: messageText,
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [{ text: buttonText, code: this.cb('my-study:continue') }],
            [{ text: '↩️ Главное меню', code: 'app:main-menu' }],
          ],
          isMultiple: false,
        },
      },
    };
  }
}
