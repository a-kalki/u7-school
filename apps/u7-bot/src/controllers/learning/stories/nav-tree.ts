import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/bot/u7-bot-user-story';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';
import type { NavigationTree } from '@u7-scl/stream/domain';
import { StreamDs } from '@u7-scl/stream/domain';
import {
  editOrSend,
  getStudentAndStream,
  loadStepDescriptions,
  respondInContext,
} from '../shared';

/**
 * Дерево уроков с маркерами ✅/▶️/🔒 (S05b).
 * Три уровня навигации: проекты → уроки → шаги.
 */
export class NavTreeStory extends U7BotUserStory {
  readonly name = 'nav-tree';

  async handleCallback(
    action: string,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
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
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  // ── Приватные методы: форматирование дерева ──

  /**
   * Форматирует дерево в текст: проекты → уроки → шаги со статусами.
   * @param maxDepth 1 = проекты+уроки, 2 = всё (по умолчанию 2).
   * @param stepsByLesson опциональная карта lessonId → шаги с описаниями.
   */
  #formatTreeBody(
    tree: NavigationTree,
    stepsByLesson?: Record<
      string,
      Array<{ uuid: string; description: string }>
    >,
    maxDepth = 2,
  ): string {
    const esc = this.escapeMarkdown;
    const lines: string[] = [];
    const sIcon: Record<string, string> = {
      completed: '✅',
      current: '▶️',
      locked: '🔒',
    };

    let pi = 0;
    for (const p of tree.projects) {
      pi++;
      lines.push(
        `📁 *Проект ${pi}: ${esc(p.title)}* \\(${p.completedLessons}/${p.totalLessons}\\) ${sIcon[p.status]}`,
      );
      let li = 0;
      for (const l of p.lessons) {
        li++;
        lines.push(
          `    📝 Урок ${li}: ${esc(l.title)} \\(${l.completedSteps}/${l.totalSteps}\\) ${sIcon[l.status]}`,
        );
        if (maxDepth < 2) continue;
        const stepDescs = stepsByLesson?.[l.lessonId];
        for (const s of l.steps) {
          const desc = stepDescs?.find((d) => d.uuid === s.stepId)?.description;
          lines.push(
            `        📄 Шаг ${s.index}: ${esc(desc ?? '—')} ${sIcon[s.status]}`,
          );
        }
      }
      lines.push('');
    }

    return lines.join('\n').trimEnd();
  }

  // ── Уровень 1: список проектов ──

  /** Уровень 1: список проектов с прогрессом. */
  async #showProjects(actor: User, session: SessionData): Promise<BotResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      const _studentResult = 'student' in { student } ? undefined : undefined;
      return editOrSend(
        { sendMessage: { text: '📖 Вы не записаны ни на один поток' } },
        session,
      );
    }

    const tree = StreamDs.buildNavigationTree(stream.contentSnapshot, student);

    // Загружаем описания шагов для всех уроков
    const lessonIds = tree.projects.flatMap((p) =>
      p.lessons.map((l) => l.lessonId),
    );
    const stepsByLesson = lessonIds.length
      ? await loadStepDescriptions(this.appApi, lessonIds)
      : undefined;

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

    rows.push([
      { text: '⬅️ Назад к учёбе', code: this.cbFor('hub', 'my-study') },
    ]);

    const description: BotResponse = {
      sendMessage: {
        text: `📂 *Уроки*\n\n${this.#formatTreeBody(tree, stepsByLesson, 1)}`,
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };

    return respondInContext(description, session);
  }

  // ── Уровень 2: уроки проекта ──

  /** Уровень 2: уроки проекта. */
  async #showLessons(
    actor: User,
    projectIndex: number,
    session: SessionData,
  ): Promise<BotResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      return editOrSend(
        { sendMessage: { text: '📖 Вы не записаны ни на один поток' } },
        session,
      );
    }

    const tree = StreamDs.buildNavigationTree(stream.contentSnapshot, student);

    const project = tree.projects[projectIndex - 1];
    if (!project) {
      return editOrSend(
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

    // Загружаем описания шагов для уроков проекта
    const lessonIds = project.lessons.map((l) => l.lessonId);
    const stepsByLesson = await loadStepDescriptions(this.appApi, lessonIds);

    const esc = this.escapeMarkdown;
    const sIcon: Record<string, string> = {
      completed: '✅',
      current: '▶️',
      locked: '🔒',
    };
    const bodyLines: string[] = [];
    let li = 0;
    for (const l of project.lessons) {
      li++;
      bodyLines.push(
        `📝 *Урок ${li}: ${esc(l.title)}* \\(${l.completedSteps}/${l.totalSteps}\\) ${sIcon[l.status]}`,
      );
      const stepDescs = stepsByLesson?.[l.lessonId];
      for (const s of l.steps) {
        const desc = stepDescs?.find((d) => d.uuid === s.stepId)?.description;
        bodyLines.push(
          `    📄 Шаг ${s.index}: ${esc(desc ?? '—')} ${sIcon[s.status]}`,
        );
      }
    }

    const description: BotResponse = {
      sendMessage: {
        text: `📂 *Уроки* › ${esc(project.title)}\n\n${bodyLines.join('\n')}`,
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };

    return respondInContext(description, session);
  }

  // ── Уровень 3: шаги урока ──

  /** Уровень 3: шаги урока с маркерами ✅/▶️/🔒. */
  async #showSteps(
    actor: User,
    lessonId: string,
    session: SessionData,
  ): Promise<BotResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      return editOrSend(
        { sendMessage: { text: '📖 Вы не записаны ни на один поток' } },
        session,
      );
    }

    const view = StreamDs.buildLessonSteps(
      stream.contentSnapshot,
      lessonId,
      student,
    );

    if (!view) {
      return editOrSend({ sendMessage: { text: '⚠️ Урок не найден' } }, session);
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
              ? this.cbFor(
                  'step-view',
                  'my-study:view',
                  student.streamId,
                  s.stepId,
                )
              : this.cbFor('step-view', 'my-study:continue'),
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

    return respondInContext(description, session);
  }
}
