import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { fromError } from '@u7-scl/core/domain';
import { type MdText, md, mdConcat, mdJoin, mdRaw } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';
import type { ContentSnapshot, Course } from '@u7-scl/course/domain';
import { renderTree, type TreeNode } from '../../../shared/tree-renderer';
import { buttons } from '../../shared/buttons';
import { Routes } from '../../shared/routes';

/** Эмодзи для направлений */
const TRACK_EMOJI: Record<string, string> = {
  tech: '💻',
  business: '💼',
};
const DEFAULT_TRACK_EMOJI = '📚';

/**
 * Story «Программы курсов» — каталог курсов.
 * Доступна всем ролям.
 *
 * Единая иерархия (как «Моя учёба → Уроки»):
 *   S00:  курсы + этапы inline
 *   S00b: этапы + модули inline
 *   S00c: модули + проекты inline
 *   S00d: проекты + уроки inline (tree-renderer)
 *   S00e: уроки + заголовки шагов (без тел)
 *
 * На каждом уровне: текущие объекты жирным + кнопками,
 * подуровень — inline текстом.
 */
export class CourseCatalogStory extends U7BotUiStory {
  readonly name = 'course-catalog';

  // ── Главное меню (декларативные кнопки) ──

  override menuButtons(_actor: User): MenuButton[] {
    return [
      {
        kind: 'callback',
        text: '📖 Программы курсов',
        action: this.cb('list'),
        priority: 10,
        description:
          '📖 Программы курсов — каталог учебных курсов и их структура',
      },
    ];
  }

  // ── Callback ──

  override async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, ...ids] = action.split(':');

    switch (cmd) {
      case 'list':
        return this.#handleList();
      case 'phases':
        return this.#handlePhases(ids[0] ?? '');
      case 'modules':
        return this.#handleModules(ids[0] ?? '', Number(ids[1]));
      case 'projects':
        return this.#handleProjects(ids[0] ?? '', Number(ids[1]), ids[2] ?? '');
      case 'lessons':
        return this.#handleLessons(
          ids[0] ?? '',
          Number(ids[1]),
          ids[2] ?? '',
          Number(ids[3]),
        );
      case 'wish':
        return this.#handleWishModule(ids[0] ?? '', actor);
      case 'apply':
        return this.#handleApply(ids[0] ?? '', actor);
      case 'cancel':
        // W05 — экран подтверждения отмены желания
        return this.confirm(
          'cancel',
          ids[0] ?? '',
          md`Отменить желание пройти курс?`,
          {
            cancelCode: this.cb('phases', ids[0] ?? ''),
          },
        );
      case 'cancel-confirm':
        return this.#handleCancelConfirm(ids[0] ?? '', actor);
      case 'cancel-mod':
        // W05-M — экран подтверждения отмены желания модуля
        return this.confirm(
          'cancel-mod',
          ids[0] ?? '',
          md`Отменить желание пройти модуль?`,
          {
            cancelCode: Routes.app.mainMenu,
          },
        );
      case 'cancel-mod-confirm':
        return this.#handleCancelModConfirm(ids[0] ?? '', actor);
      default:
        return this.unknownCommand(action, actor, session);
    }
  }

  // ═══ Уровень 0: Курсы + этапы inline ═══

  async #handleList(): Promise<DialogResponse> {
    const courses = (await this.appApi.execute('list-courses', {})) as Course[];

    if (courses.length === 0) {
      return this.screen(
        md`📖 *Курсы*\n\nПока нет доступных курсов\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    }

    const lines: MdText[] = [md`📖 *Курсы*`, md``];
    const rows: KbButton[][] = [];

    for (const course of courses) {
      const direction = this.#getDirectionEmoji(course);

      lines.push(md`${direction} *Курс: ${course.title}*`);

      // Этапы курса inline (один уровень вниз)
      for (const phase of course.phases) {
        const phaseEmoji = phase.track
          ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
          : '🗂️';
        const modCount = phase.moduleIds?.length ?? 0;
        lines.push(
          md`    ${phaseEmoji} Этап: ${phase.title} — ${modCount} модул${this.#plural(modCount, 'ь', 'я', 'ей')}`,
        );
      }

      lines.push(md``);

      rows.push([
        this.btn(
          `${direction} ${course.title}`,
          this.cb('phases', course.uuid),
        ),
        this.btn('🎓 Хочу пройти курс', this.cb('apply', course.uuid)),
      ]);
    }

    rows.push([buttons.mainMenu()]);

    return this.screen(mdJoin(lines), this.kb(rows));
  }

  // ═══ Уровень 1: Этапы + модули inline ═══

  async #handlePhases(courseId: string): Promise<DialogResponse> {
    if (!courseId) {
      return this.screen(md`⚠️ Курс не указан`);
    }

    let course: Course;
    try {
      course = (await this.appApi.execute('get-course', {
        uuid: courseId,
      })) as Course;
    } catch {
      return this.screen(md`⚠️ Курс не найден или недоступен`);
    }

    const lines: MdText[] = [md`📖 *Курс: ${course.title}*`, md``];
    const rows: KbButton[][] = [];

    for (let pi = 0; pi < course.phases.length; pi++) {
      const phase = course.phases[pi];
      if (!phase) continue;
      const emoji = phase.track
        ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
        : '🗂️';
      const modCount = phase.moduleIds?.length ?? 0;

      lines.push(
        md`${emoji} *Этап: ${phase.title}* — ${modCount} модул${this.#plural(modCount, 'ь', 'я', 'ей')}`,
      );

      // Модули этапа inline (один уровень вниз) — нужны заголовки
      for (const modId of phase.moduleIds ?? []) {
        try {
          const mod = (await this.appApi.execute('get-module', {
            uuid: modId,
          })) as { title: string; projects?: Array<{ lessonIds: string[] }> };
          const projCount = mod.projects?.length ?? 0;
          const lessonCount =
            mod.projects?.reduce((s, p) => s + (p.lessonIds?.length ?? 0), 0) ??
            0;
          lines.push(
            md`    📦 Модуль: ${mod.title} — ${projCount} проект${this.#plural(projCount, '', 'а', 'ов')}, ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}`,
          );
        } catch {
          lines.push(md`    📦 _модуль ${modId.slice(0, 8)}\\.\\.\\._`);
        }
      }

      lines.push(md``);

      rows.push([
        this.btn(
          `${emoji} ${phase.title}`,
          this.cb('modules', courseId, String(pi)),
        ),
      ]);
    }

    rows.push([this.btn('⬅️ Назад к курсам школы', this.cb('list'))]);

    return this.screen(this.#truncate(mdJoin(lines)), this.kb(rows));
  }

  // ═══ Уровень 2: Модули + проекты inline ═══

  async #handleModules(
    courseId: string,
    phaseIdx: number,
  ): Promise<DialogResponse> {
    if (!courseId) {
      return this.screen(md`⚠️ Курс не указан`);
    }

    let course: Course;
    try {
      course = (await this.appApi.execute('get-course', {
        uuid: courseId,
      })) as Course;
    } catch {
      return this.screen(md`⚠️ Курс не найден или недоступен`);
    }

    const phase = course.phases[phaseIdx];
    if (!phase) {
      return this.screen(md`⚠️ Этап не найден`);
    }

    const lines: MdText[] = [md`📖 *Этап: ${phase.title}*`, md``];
    const rows: KbButton[][] = [];

    for (const modId of phase.moduleIds ?? []) {
      let mod: {
        title: string;
        projects?: Array<{ uuid: string; title: string; lessonIds: string[] }>;
      };
      try {
        mod = (await this.appApi.execute('get-module', {
          uuid: modId,
        })) as typeof mod;
      } catch {
        continue;
      }

      const projects = mod.projects ?? [];
      const projCount = projects.length;
      const lessonCount = projects.reduce(
        (s, p) => s + (p.lessonIds?.length ?? 0),
        0,
      );

      lines.push(
        md`📦 *Модуль: ${mod.title}* — ${projCount} проект${this.#plural(projCount, '', 'а', 'ов')}, ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}`,
      );

      // Проекты модуля inline (один уровень вниз)
      for (const proj of projects) {
        const lCount = proj.lessonIds?.length ?? 0;
        lines.push(
          md`    📁 Проект: ${proj.title} — ${lCount} урок${this.#plural(lCount, '', 'а', 'ов')}`,
        );
      }

      lines.push(md``);

      rows.push([
        this.btn(
          `📦 ${mod.title}`,
          this.cb('projects', courseId, String(phaseIdx), modId),
        ),
      ]);
    }

    rows.push([this.btn('⬅️ Назад к курсу', this.cb('phases', courseId))]);

    return this.screen(this.#truncate(mdJoin(lines)), this.kb(rows));
  }

  // ═══ Уровень 3: Проекты + уроки inline (tree-renderer) ═══

  async #handleProjects(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
  ): Promise<DialogResponse> {
    if (!moduleId) {
      return this.screen(md`⚠️ Модуль не указан`);
    }

    let snapshot: ContentSnapshot;
    try {
      snapshot = (await this.appApi.execute('get-module-snapshot', {
        moduleId,
      })) as ContentSnapshot;
    } catch {
      return this.screen(md`⚠️ Модуль не найден или недоступен`);
    }

    // Получаем название модуля для заголовка
    let modTitle = '';
    try {
      const mod = (await this.appApi.execute('get-module', {
        uuid: moduleId,
      })) as { title: string };
      modTitle = mod.title;
    } catch {
      // оставляем пустым
    }

    // Строим дерево через tree-renderer.
    // Контракт TreeNode.title — «уже экранированный для MarkdownV2»,
    // поэтому заголовки пропускаем через md-интерполяцию ДО renderTree.
    const treeNodes: TreeNode[] = snapshot.map((project) => ({
      title: md`${project.projectTitle}`,
      emoji: '📁',
      meta: this.#lessonSummary(project.lessons),
      children: project.lessons.map((lesson) => ({
        title: md`${lesson.lessonTitle}`,
        emoji: '📝',
        meta: `${lesson.stepIds.length} шаг${this.#plural(lesson.stepIds.length, '', 'а', 'ов')}`,
      })),
    }));

    const lines: MdText[] = [
      md`📖 *Модуль: ${modTitle}*`,
      md``,
      mdRaw(renderTree(treeNodes)),
      md``,
    ];

    // Кнопки — проекты
    const rows: KbButton[][] = [];
    for (let pi = 0; pi < snapshot.length; pi++) {
      const project = snapshot[pi];
      if (!project) continue;
      rows.push([
        this.btn(
          `📁 ${project.projectTitle}`,
          this.cb('lessons', courseId, String(phaseIdx), moduleId, String(pi)),
        ),
      ]);
    }

    rows.push([
      this.btn(
        '⬅️ Назад к этапу',
        this.cb('modules', courseId, String(phaseIdx)),
      ),
    ]);

    return this.screen(this.#truncate(mdJoin(lines)), this.kb(rows));
  }

  // ═══ Уровень 4: Уроки + заголовки шагов (тела скрыты) ═══

  async #handleLessons(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
    projectIdx: number,
  ): Promise<DialogResponse> {
    if (!moduleId) {
      return this.screen(md`⚠️ Модуль не указан`);
    }

    let snapshot: ContentSnapshot;
    try {
      snapshot = (await this.appApi.execute('get-module-snapshot', {
        moduleId,
      })) as ContentSnapshot;
    } catch {
      return this.screen(md`⚠️ Модуль не найден или недоступен`);
    }

    const project = snapshot[projectIdx];
    if (!project) {
      return this.screen(md`⚠️ Проект не найден`);
    }

    const lines: MdText[] = [md`📖 *Проект: ${project.projectTitle}*`, md``];
    const rows: KbButton[][] = [];

    if (project.lessons.length === 0) {
      lines.push(md`_В этом проекте пока нет уроков_`);
    } else {
      for (const lesson of project.lessons) {
        const sCount = lesson.stepIds.length;

        lines.push(
          md`📝 *Урок: ${lesson.lessonTitle}* — ${sCount} шаг${this.#plural(sCount, '', 'а', 'ов')}`,
        );

        // Шаги урока inline
        if (sCount > 0) {
          const stepsByLesson = (await this.appApi.execute(
            'get-steps-by-lessons',
            { lessonIds: [lesson.lessonId] },
          )) as Record<string, Array<{ uuid: string; description: string }>>;

          const steps = stepsByLesson[lesson.lessonId] ?? [];
          const maxSteps = Math.min(steps.length, 3);
          for (let si = 0; si < maxSteps; si++) {
            const step = steps[si];
            if (!step) continue;
            lines.push(md`    ${si + 1}\\. ${step.description}`);
          }
          if (steps.length > 3) {
            lines.push(md`    \\.\\.\\.`);
          }
        }
      }
    }

    rows.push([
      this.btn(
        '⬅️ Назад к модулю',
        this.cb('projects', courseId, String(phaseIdx), moduleId),
      ),
    ]);

    return this.screen(this.#truncate(mdJoin(lines)), this.kb(rows));
  }

  // ═══ Утилиты ═══

  #getDirectionEmoji(course: Course): string {
    for (const phase of course.phases) {
      if (phase.track) {
        const emoji = TRACK_EMOJI[phase.track];
        if (emoji) return emoji;
      }
    }
    return DEFAULT_TRACK_EMOJI;
  }

  #plural(count: number, one: string, two: string, five: string): string {
    const n = count % 100;
    if (n >= 11 && n <= 19) return five;
    const r = n % 10;
    if (r === 1) return one;
    if (r >= 2 && r <= 4) return two;
    return five;
  }

  #lessonSummary(lessons: Array<{ stepIds: string[] }>): string {
    const lessonCount = lessons.length;
    const stepCount = lessons.reduce((s, l) => s + l.stepIds.length, 0);
    return `${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}, ${stepCount} шаг${this.#plural(stepCount, '', 'а', 'ов')}`;
  }

  #truncate(text: MdText, maxLen = 4000): MdText {
    if (text.length <= maxLen) return text;
    return mdConcat(mdRaw(text.slice(0, maxLen - 15)), md`${'...'}`);
  }

  // ── Желание пройти курс (кнопка из карточки курса) ──

  /**
   * apply:{courseId} — фиксирует желание пройти курс (W01→W02/W03).
   *
   * outcome instant — рендер W03; outcome questionnaire — анкету
   * проактивно рендерит FillStory (подписка на questionnaire:start),
   * стори ничего не отправляет. Конфликт WISH_ALREADY_EXISTS — экран W04.
   */
  async #handleApply(courseId: string, actor: User): Promise<DialogResponse> {
    if (!courseId) {
      return this.screen(md`⚠️ Курс не указан`);
    }

    try {
      const { outcome } = (await this.appApi.execute(
        'create-course-wish',
        { courseId },
        actor.uuid,
      )) as { outcome: 'instant' | 'questionnaire' };

      if (outcome === 'questionnaire') {
        // Анкета запущена UC — её экраны приходят проактивно через FillStory
        return {};
      }

      // W03 — мгновенная фиксация (курс без пула анкеты)
      return this.screen(
        md`🎯 Твоё желание пройти курс зафиксировано\\!\n\nМы напишем тебе, когда откроется набор на этот курс\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    } catch (err) {
      // W04 — желание уже есть / анкета начата (конфликт — не ошибка).
      // Ветвление по статусу существующего желания (payload ошибки).
      if (fromError(err).kind === 'conflict') {
        const status =
          (fromError(err).payload as { status?: string } | undefined)?.status ??
          'expressed';

        if (status === 'pending') {
          // Анкета начата, но не завершена — выход есть: продолжить анкету
          return this.screen(
            md`📝 Ты начал заполнять анкету по этому курсу, но не закончил её\\.\nПродолжи — и желание будет закреплено\\.`,
            this.kb([
              [
                this.btn(
                  '▶️ Продолжить анкету',
                  Routes.questionnaire.resume(courseId),
                ),
              ],
              [buttons.mainMenu()],
            ]),
          );
        }

        const text =
          status === 'confirmed'
            ? md`📚 Ты уже обучаешься на этом курсе\\.`
            : md`📝 Ты уже выразил желание пройти этот курс\\.`;
        return this.screen(
          text,
          this.kb([
            [this.btn('🗑️ Отменить желание', this.cb('cancel', courseId))],
            [buttons.mainMenu()],
          ]),
        );
      }
      return this.errorNotify(err);
    }
  }

  // ── Запись на модуль (кнопка из уведомления о завершении) ──

  /** wish:{moduleId} — фиксирует желание пройти модуль. */
  async #handleWishModule(
    moduleId: string,
    actor: User,
  ): Promise<DialogResponse> {
    try {
      await this.appApi.execute('create-module-wish', { moduleId }, actor.uuid);

      return this.screen(
        md`✅ Записали\\! Мы сообщим, когда откроется набор на модуль\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    } catch (err) {
      // Повторное желание — не ошибка для пользователя
      if (fromError(err).kind === 'conflict') {
        return this.screen(
          md`ℹ️ Ты уже записан на этот модуль — ждём открытия набора\\.`,
          this.kb([[buttons.mainMenu()]]),
        );
      }
      return this.errorNotify(err);
    }
  }

  /** cancel-confirm:{courseId} — подтверждённая отмена желания курса (W05). */
  async #handleCancelConfirm(
    courseId: string,
    actor: User,
  ): Promise<DialogResponse> {
    try {
      await this.appApi.execute(
        'cancel-wish',
        { kind: 'course', courseId },
        actor.uuid,
      );

      return this.screen(
        md`🗑️ Желание пройти курс отменено\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    } catch (err) {
      // Гонка: желание уже отменили — не ошибка для пользователя
      if (fromError(err).kind === 'not-found') {
        return this.screen(
          md`ℹ️ Активного желания на этот курс уже нет\\.`,
          this.kb([[buttons.mainMenu()]]),
        );
      }
      return this.errorNotify(err);
    }
  }

  /** cancel-mod-confirm:{moduleId} — подтверждённая отмена желания модуля (W05-M). */
  async #handleCancelModConfirm(
    moduleId: string,
    actor: User,
  ): Promise<DialogResponse> {
    try {
      await this.appApi.execute(
        'cancel-wish',
        { kind: 'module', moduleId },
        actor.uuid,
      );

      return this.screen(
        md`🗑️ Желание пройти модуль отменено\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    } catch (err) {
      // Гонка: желание уже отменили — не ошибка для пользователя
      if (fromError(err).kind === 'not-found') {
        return this.screen(
          md`ℹ️ Активного желания на этот модуль уже нет\\.`,
          this.kb([[buttons.mainMenu()]]),
        );
      }
      return this.errorNotify(err);
    }
  }
}
