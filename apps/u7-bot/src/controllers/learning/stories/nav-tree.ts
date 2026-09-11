import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md, mdConcat, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';
import type { NavigationTree } from '@u7-scl/stream/domain';
import { StreamDs } from '@u7-scl/stream/domain';
import {
  getStudentAndStream,
  loadStepDescriptions,
  notEnrolled,
} from '../shared';

/** Иконки статуса элементов дерева (✅ пройдено / ▶️ текущий / 🔒 закрыто). */
const STATUS_ICONS: Record<string, string> = {
  completed: '✅',
  current: '▶️',
  locked: '🔒',
};

/**
 * Дерево уроков с маркерами ✅/▶️/🔒 (S05b).
 * Три уровня навигации: проекты → уроки → шаги.
 *
 * Drill-down внутри стори — тот же dialog.path: транспорт рендерит
 * ответ edit'ом на месте («владеешь экраном — обновляй»).
 */
export class NavTreeStory extends U7BotUiStory {
  readonly name = 'nav-tree';

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (action === 'my-study:lessons') {
      return this.#showProjects(actor);
    }
    if (action.startsWith('my-study:project:')) {
      const projectIndex = Number.parseInt(action.split(':')[2] ?? '0', 10);
      return this.#showLessons(actor, projectIndex);
    }
    if (action.startsWith('my-study:lesson:')) {
      const lessonId = action.split(':').slice(2).join(':');
      return this.#showSteps(actor, lessonId);
    }
    return this.unknownCommand(action, actor, session);
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
  ): MdText {
    const lines: MdText[] = [];

    let pi = 0;
    for (const p of tree.projects) {
      pi++;
      lines.push(
        md`📁 *Проект ${pi}: ${p.title}* \\(${p.completedLessons}/${p.totalLessons}\\) ${STATUS_ICONS[p.status] ?? ''}`,
      );
      let li = 0;
      for (const l of p.lessons) {
        li++;
        lines.push(
          md`    📝 Урок ${li}: ${l.title} \\(${l.completedSteps}/${l.totalSteps}\\) ${STATUS_ICONS[l.status] ?? ''}`,
        );
        if (maxDepth < 2) continue;
        const stepDescs = stepsByLesson?.[l.lessonId];
        for (const s of l.steps) {
          const desc = stepDescs?.find((d) => d.uuid === s.stepId)?.description;
          lines.push(
            md`        📄 Шаг ${s.index}: ${desc ?? '—'} ${STATUS_ICONS[s.status] ?? ''}`,
          );
        }
      }
      lines.push(md``);
    }

    return mdJoin(lines).trimEnd() as MdText;
  }

  // ── Уровень 1: список проектов ──

  /** Уровень 1: список проектов с прогрессом. */
  async #showProjects(actor: User): Promise<DialogResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      return notEnrolled();
    }

    const tree = StreamDs.buildNavigationTree(stream.contentSnapshot, student);

    // Загружаем описания шагов для всех уроков
    const lessonIds = tree.projects.flatMap((p) =>
      p.lessons.map((l) => l.lessonId),
    );
    const stepsByLesson = lessonIds.length
      ? await loadStepDescriptions(this.appApi, lessonIds)
      : undefined;

    const rows: KbButton[][] = [];

    for (let pi = 0; pi < tree.projects.length; pi++) {
      const p = tree.projects[pi];
      if (!p) continue;

      rows.push([
        this.btn(
          `📁 ${p.title} (${p.completedLessons}/${p.totalLessons})`,
          this.cb('my-study:project', String(pi + 1)),
        ),
      ]);
    }

    rows.push([this.btn('⬅️ Назад к учёбе', this.cbFor('hub', 'my-study'))]);

    return this.screen(
      mdConcat(
        md`📂 *Уроки*\n\n`,
        this.#formatTreeBody(tree, stepsByLesson, 1),
      ),
      this.kb(rows),
    );
  }

  // ── Уровень 2: уроки проекта ──

  /** Уровень 2: уроки проекта. */
  async #showLessons(
    actor: User,
    projectIndex: number,
  ): Promise<DialogResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      return notEnrolled();
    }

    const tree = StreamDs.buildNavigationTree(stream.contentSnapshot, student);

    const project = tree.projects[projectIndex - 1];
    if (!project) {
      return this.screen(md`⚠️ Проект не найден`);
    }

    const rows: KbButton[][] = [];

    for (const lesson of project.lessons) {
      rows.push([
        this.btn(
          `📝 ${lesson.title} (${lesson.completedSteps}/${lesson.totalSteps})`,
          this.cb('my-study:lesson', lesson.lessonId),
        ),
      ]);
    }

    rows.push([
      { text: '⬅️ Назад к проектам', code: this.cb('my-study:lessons') },
    ]);

    // Загружаем описания шагов для уроков проекта
    const lessonIds = project.lessons.map((l) => l.lessonId);
    const stepsByLesson = await loadStepDescriptions(this.appApi, lessonIds);

    const bodyLines: MdText[] = [];
    let li = 0;
    for (const l of project.lessons) {
      li++;
      bodyLines.push(
        md`📝 *Урок ${li}: ${l.title}* \\(${l.completedSteps}/${l.totalSteps}\\) ${STATUS_ICONS[l.status] ?? ''}`,
      );
      const stepDescs = stepsByLesson?.[l.lessonId];
      for (const s of l.steps) {
        const desc = stepDescs?.find((d) => d.uuid === s.stepId)?.description;
        bodyLines.push(
          md`    📄 Шаг ${s.index}: ${desc ?? '—'} ${STATUS_ICONS[s.status] ?? ''}`,
        );
      }
    }

    return this.screen(
      mdConcat(md`📂 *Уроки* › ${project.title}\n\n`, mdJoin(bodyLines)),
      this.kb(rows),
    );
  }

  // ── Уровень 3: шаги урока ──

  /** Уровень 3: шаги урока с маркерами ✅/▶️/🔒. */
  async #showSteps(actor: User, lessonId: string): Promise<DialogResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      return notEnrolled();
    }

    const view = StreamDs.buildLessonSteps(
      stream.contentSnapshot,
      lessonId,
      student,
    );

    if (!view) {
      return this.screen(md`⚠️ Урок не найден`);
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

    const lines: MdText[] = [
      md`📂 *Уроки* › ${view.projectTitle} › ${view.lessonTitle}`,
      md``,
    ];

    for (const s of stepsWithDesc) {
      lines.push(md`${s.marker} _${s.description || s.stepId}_`);
    }

    lines.push(md``, md`Выберите шаг:`);

    // Кнопки: только доступные шаги
    const rows: KbButton[][] = [];

    for (const s of stepsWithDesc) {
      if (s.marker === '🔒') continue;
      rows.push([
        this.btn(
          `${s.marker} ${s.description || s.stepId}`,
          s.marker === '✅'
            ? this.cbFor(
                'step-view',
                'my-study:view',
                student.streamId,
                s.stepId,
              )
            : this.cbFor('step-view', 'my-study:continue'),
        ),
      ]);
    }

    rows.push([
      this.btn(
        '⬅️ Назад к урокам',
        this.cb('my-study:project', String(view.projectIndex)),
      ),
    ]);

    return this.screen(mdJoin(lines), this.kb(rows));
  }
}
