import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { errNotFound, fromError, throwError } from '@u7-scl/core/domain';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';
import type { ContentSnapshot, Course } from '@u7-scl/course/domain';
import type { Wish } from '@u7-scl/wish/domain';
import { renderTreeBlocks, type TreeNode } from '../../../shared/tree-renderer';
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

  override async menuButtons(_actor: User): Promise<MenuButton[]> {
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
        return this.#handleList(actor, session, this.#pageSeg(ids[0]));
      case 'phases':
        return this.#handlePhases(
          ids[0] ?? '',
          actor,
          session,
          this.#pageSeg(ids[1]),
        );
      case 'modules':
        return this.#handleModules(
          ids[0] ?? '',
          Number(ids[1]),
          actor,
          session,
          this.#pageSeg(ids[2]),
        );
      case 'projects':
        return this.#handleProjects(
          ids[0] ?? '',
          Number(ids[1]),
          ids[2] ?? '',
          actor,
          session,
          this.#pageSeg(ids[3]),
        );
      case 'lessons':
        return this.#handleLessons(
          ids[0] ?? '',
          Number(ids[1]),
          ids[2] ?? '',
          Number(ids[3]),
          actor,
          session,
          this.#pageSeg(ids[4]),
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

  async #handleList(
    actor: User,
    session: BotSession,
    pageIndex = 0,
  ): Promise<DialogResponse> {
    // Блок = курс со своими этапами inline; страницы кешируются в системном
    // кеше эпохи диалога — build (чтение домена) вызывается только при
    // промахе кеша, тыки навигации домен не перечитывают.
    return this.pagedScreen({
      build: async () => {
        const courses = (await this.appApi.execute(
          'list-courses',
          {},
        )) as Course[];
        if (courses.length === 0) {
          return {
            header: md`📖 *Курсы*`,
            blocks: [],
            payload: {
              courses: [],
              wishStatusByCourse: new Map<string, string>(),
            },
          };
        }

        // Батч-запрос желаний пользователя: одна выборка на весь каталог
        const wishes = ((await this.appApi.execute(
          'list-user-wishes',
          {},
          actor,
        )) ?? []) as Wish[];
        const wishStatusByCourse = this.#activeCourseWishStatuses(wishes);

        const blocks: string[] = [];
        for (const course of courses) {
          const direction = this.#getDirectionEmoji(course);

          const lines: MdText[] = [md`${direction} *Курс: ${course.title}*`];

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
          blocks.push(mdJoin(lines));
        }

        return {
          header: md`📖 *Курсы*`,
          blocks,
          payload: { courses, wishStatusByCourse },
        };
      },
      emptyScreen: () =>
        this.screen(
          md`📖 *Курсы*\\n\\nПока нет доступных курсов\\.`,
          this.kb([[buttons.mainMenu()]]),
        ),
      rows: ({ courses, wishStatusByCourse }) => {
        const rows: KbButton[][] = [];
        for (const course of courses) {
          const direction = this.#getDirectionEmoji(course);
          rows.push([
            this.btn(
              `${direction} ${course.title}`,
              this.cb('phases', course.uuid),
            ),
            ...this.#courseWishButtons(
              course.uuid,
              wishStatusByCourse.get(course.uuid),
            ),
          ]);
        }
        rows.push([buttons.mainMenu()]);
        return rows;
      },
      cacheKey: 'list',
      pageIndex,
      cbPage: (n) => this.cb('list', String(n)),
      session,
      tgId: actor.telegramId,
    });
  }

  /**
   * Активные course-желания пользователя: карта courseId → статус.
   * fulfilled (обучение) не попадает — карточка остаётся с кнопкой
   * «Хочу пройти курс» (клик → W04 «уже обучаешься»).
   */
  #activeCourseWishStatuses(wishes: Wish[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const wish of wishes ?? []) {
      if (wish.target.kind !== 'course') continue;
      if (
        wish.status === 'pending' ||
        wish.status === 'expressed' ||
        wish.status === 'confirmed'
      ) {
        map.set(wish.target.courseId, wish.status);
      }
    }
    return map;
  }

  /** Кнопка желания на карточке курса — по статусу (W01). */
  #courseWishButtons(courseId: string, status: string | undefined): KbButton[] {
    if (status === 'pending') {
      // Анкета начата — путь к желанию лежит через её продолжение
      return [
        this.btn('📝 Продолжить анкету', Routes.questionnaire.resume(courseId)),
      ];
    }
    if (status === 'expressed' || status === 'confirmed') {
      return [this.btn('🗑️ Отменить желание', this.cb('cancel', courseId))];
    }
    return [this.btn('🎓 Хочу пройти курс', this.cb('apply', courseId))];
  }

  // ═══ Уровень 1: Этапы + модули inline ═══

  async #handlePhases(
    courseId: string,
    actor: User,
    session: BotSession,
    pageIndex = 0,
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

    // Блок = этап со своими модулями inline (модули читаются только при
    // промахе кеша — N запросов get-module не повторяются при листании).
    return this.pagedScreen({
      build: async () => {
        const blocks: string[] = [];
        for (const phase of course.phases) {
          const emoji = phase.track
            ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
            : '🗂️';
          const modCount = phase.moduleIds?.length ?? 0;

          const lines: MdText[] = [
            md`${emoji} *Этап: ${phase.title}* — ${modCount} модул${this.#plural(modCount, 'ь', 'я', 'ей')}`,
          ];

          // Модули этапа inline (один уровень вниз) — нужны заголовки
          for (const modId of phase.moduleIds ?? []) {
            try {
              const mod = (await this.appApi.execute('get-module', {
                uuid: modId,
              })) as {
                title: string;
                projects?: Array<{ lessonIds: string[] }>;
              };
              const projCount = mod.projects?.length ?? 0;
              const lessonCount =
                mod.projects?.reduce(
                  (sum, pr) => sum + (pr.lessonIds?.length ?? 0),
                  0,
                ) ?? 0;
              lines.push(
                md`    📦 Модуль: ${mod.title} — ${projCount} проект${this.#plural(projCount, '', 'а', 'ов')}, ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}`,
              );
            } catch {
              lines.push(md`    📦 _модуль ${modId.slice(0, 8)}\\.\\.\\._`);
            }
          }

          lines.push(md``);
          blocks.push(mdJoin(lines));
        }

        return {
          header: md`📖 *Курс: ${course.title}*`,
          blocks,
          payload: course,
        };
      },
      emptyScreen: () =>
        this.screen(
          md`📖 *Курс: ${course.title}*`,
          this.kb([[this.btn('⬅️ Назад к курсам школы', this.cb('list'))]]),
        ),
      rows: (c) => {
        const rows: KbButton[][] = [];
        for (let pi = 0; pi < c.phases.length; pi++) {
          const phase = c.phases[pi];
          if (!phase) continue;
          const emoji = phase.track
            ? (TRACK_EMOJI[phase.track] ?? DEFAULT_TRACK_EMOJI)
            : '🗂️';
          rows.push([
            this.btn(
              `${emoji} ${phase.title}`,
              this.cb('modules', courseId, String(pi)),
            ),
          ]);
        }
        rows.push([this.btn('⬅️ Назад к курсам школы', this.cb('list'))]);
        return rows;
      },
      cacheKey: `phases:${courseId}`,
      pageIndex,
      cbPage: (n) => this.cb('phases', courseId, String(n)),
      session,
      tgId: actor.telegramId,
    });
  }

  // ═══ Уровень 2: Модули + проекты inline ═══

  async #handleModules(
    courseId: string,
    phaseIdx: number,
    actor: User,
    session: BotSession,
    pageIndex = 0,
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

    // Блок = модуль со своими проектами inline; кнопки модулей строятся из
    // payload кеша — get-module вызывается только при промахе кеша.
    return this.pagedScreen({
      build: async () => {
        const blocks: string[] = [];
        const mods: Array<{ id: string; title: string }> = [];

        for (const modId of phase.moduleIds ?? []) {
          let mod: {
            title: string;
            projects?: Array<{
              uuid: string;
              title: string;
              lessonIds: string[];
            }>;
          };
          try {
            mod = (await this.appApi.execute('get-module', {
              uuid: modId,
            })) as typeof mod;
          } catch {
            continue;
          }

          mods.push({ id: modId, title: mod.title });

          const projects = mod.projects ?? [];
          const projCount = projects.length;
          const lessonCount = projects.reduce(
            (sum, pr) => sum + (pr.lessonIds?.length ?? 0),
            0,
          );

          const lines: MdText[] = [
            md`📦 *Модуль: ${mod.title}* — ${projCount} проект${this.#plural(projCount, '', 'а', 'ов')}, ${lessonCount} урок${this.#plural(lessonCount, '', 'а', 'ов')}`,
          ];

          // Проекты модуля inline (один уровень вниз)
          for (const proj of projects) {
            const lCount = proj.lessonIds?.length ?? 0;
            lines.push(
              md`    📁 Проект: ${proj.title} — ${lCount} урок${this.#plural(lCount, '', 'а', 'ов')}`,
            );
          }

          lines.push(md``);
          blocks.push(mdJoin(lines));
        }

        return { header: md`📖 *Этап: ${phase.title}*`, blocks, payload: mods };
      },
      emptyScreen: () =>
        this.screen(
          md`📖 *Этап: ${phase.title}*`,
          this.kb([[this.btn('⬅️ Назад к курсу', this.cb('phases', courseId))]]),
        ),
      rows: (mods) => {
        const rows: KbButton[][] = [];
        for (const mod of mods) {
          rows.push([
            this.btn(
              `📦 ${mod.title}`,
              this.cb('projects', courseId, String(phaseIdx), mod.id),
            ),
          ]);
        }
        rows.push([this.btn('⬅️ Назад к курсу', this.cb('phases', courseId))]);
        return rows;
      },
      cacheKey: `modules:${courseId}:${phaseIdx}`,
      pageIndex,
      cbPage: (n) => this.cb('modules', courseId, String(phaseIdx), String(n)),
      session,
      tgId: actor.telegramId,
    });
  }

  // ═══ Уровень 3: Проекты + уроки inline (tree-renderer) ═══

  async #handleProjects(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
    actor: User,
    session: BotSession,
    pageIndex = 0,
  ): Promise<DialogResponse> {
    if (!moduleId) {
      return this.screen(md`⚠️ Модуль не указан`);
    }

    // Снапшот модуля — тяжёлое чтение: только при промахе кеша (в build).
    // Not-found экрана — по ошибке build.
    try {
      return await this.pagedScreen({
        build: async () => {
          const snapshot = (await this.appApi.execute('get-module-snapshot', {
            moduleId,
          })) as ContentSnapshot;

          // Название модуля для заголовка (не критично)
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
          // Тип объекта подписан явно («Проект:», «Урок:») — как на других уровнях.
          const treeNodes: TreeNode[] = snapshot.map((project) => ({
            title: md`Проект: ${project.projectTitle}`,
            emoji: '📁',
            meta: this.#lessonSummary(project.lessons),
            children: project.lessons.map((lesson) => ({
              title: md`Урок: ${lesson.lessonTitle}`,
              emoji: '📝',
              meta: `${lesson.stepIds.length} шаг${this.#plural(lesson.stepIds.length, '', 'а', 'ов')}`,
            })),
          }));

          // Блок = проект с уроками (целый, не рвётся)
          return {
            header: md`📖 *Модуль: ${modTitle}*`,
            blocks: renderTreeBlocks(treeNodes),
            payload: { snapshot, modTitle },
          };
        },
        emptyScreen: ({ modTitle }) =>
          this.screen(
            md`📖 *Модуль: ${modTitle}*`,
            this.kb([
              [
                this.btn(
                  '⬅️ Назад к этапу',
                  this.cb('modules', courseId, String(phaseIdx)),
                ),
              ],
            ]),
          ),
        rows: ({ snapshot }) => {
          const rows: KbButton[][] = [];
          for (let pi = 0; pi < snapshot.length; pi++) {
            const project = snapshot[pi];
            if (!project) continue;
            rows.push([
              this.btn(
                `📁 ${project.projectTitle}`,
                this.cb(
                  'lessons',
                  courseId,
                  String(phaseIdx),
                  moduleId,
                  String(pi),
                ),
              ),
            ]);
          }
          rows.push([
            this.btn(
              '⬅️ Назад к этапу',
              this.cb('modules', courseId, String(phaseIdx)),
            ),
          ]);
          return rows;
        },
        cacheKey: `projects:${moduleId}`,
        pageIndex,
        cbPage: (n) =>
          this.cb('projects', courseId, String(phaseIdx), moduleId, String(n)),
        session,
        tgId: actor.telegramId,
      });
    } catch {
      return this.screen(md`⚠️ Модуль не найден или недоступен`);
    }
  }

  // ═══ Уровень 4: Уроки + заголовки шагов (тела скрыты) ═══

  async #handleLessons(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
    projectIdx: number,
    actor: User,
    session: BotSession,
    pageIndex = 0,
  ): Promise<DialogResponse> {
    if (!moduleId) {
      return this.screen(md`⚠️ Модуль не указан`);
    }

    // Блок = урок с заголовками шагов inline; снапшот и шаги читаются
    // только при промахе кеша (в build).
    try {
      return await this.pagedScreen({
        build: async () => {
          const snapshot = (await this.appApi.execute('get-module-snapshot', {
            moduleId,
          })) as ContentSnapshot;
          const project = snapshot[projectIdx];
          if (!project) {
            throwError(
              errNotFound('PROJECT_NOT_FOUND', 'Проект не найден', undefined),
            );
          }

          const blocks: string[] = [];
          if (project.lessons.length === 0) {
            // Блоков нет — заглушка через emptyScreen
            return {
              header: md`📖 *Проект: ${project.projectTitle}*`,
              blocks: [],
              payload: project.projectTitle,
            };
          }

          for (const lesson of project.lessons) {
            const sCount = lesson.stepIds.length;

            const lines: MdText[] = [
              md`📝 *Урок: ${lesson.lessonTitle}* — ${sCount} шаг${this.#plural(sCount, '', 'а', 'ов')}`,
            ];

            // Шаги урока inline
            if (sCount > 0) {
              const stepsByLesson = (await this.appApi.execute(
                'get-steps-by-lessons',
                { lessonIds: [lesson.lessonId] },
              )) as Record<
                string,
                Array<{ uuid: string; description: string }>
              >;

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

            blocks.push(mdJoin(lines));
          }

          return {
            header: md`📖 *Проект: ${project.projectTitle}*`,
            blocks,
            payload: project.projectTitle,
          };
        },
        emptyScreen: (title) =>
          this.screen(
            md`📖 *Проект: ${title}*\n\n_В этом проекте пока нет уроков_`,
            this.kb([
              [
                this.btn(
                  '⬅️ Назад к модулю',
                  this.cb('projects', courseId, String(phaseIdx), moduleId),
                ),
              ],
            ]),
          ),
        rows: () => [
          [
            this.btn(
              '⬅️ Назад к модулю',
              this.cb('projects', courseId, String(phaseIdx), moduleId),
            ),
          ],
        ],
        cacheKey: `lessons:${moduleId}:${projectIdx}`,
        pageIndex,
        cbPage: (n) =>
          this.cb(
            'lessons',
            courseId,
            String(phaseIdx),
            moduleId,
            String(projectIdx),
            String(n),
          ),
        session,
        tgId: actor.telegramId,
      });
    } catch (err) {
      if (fromError(err).name === 'PROJECT_NOT_FOUND') {
        return this.screen(md`⚠️ Проект не найден`);
      }
      return this.screen(md`⚠️ Модуль не найден или недоступен`);
    }
  }

  // ═══ Утилиты ═══

  /** Номер страницы из сегмента колбэка (NaN/отсутствие → 0). */
  #pageSeg(seg: string | undefined): number {
    const n = Number(seg);
    return Number.isNaN(n) ? 0 : n;
  }

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
        actor,
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
      await this.appApi.execute('create-module-wish', { moduleId }, actor);

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
        actor,
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
        actor,
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
