import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { fromError } from '@u7-scl/core/domain';
import { md } from '@u7-scl/core/shared';
import {
  type BotSession,
  type DialogResponse,
  presentNavLevel,
} from '@u7-scl/core/ui';
import type { ContentSnapshot, Course } from '@u7-scl/course/domain';
import type { Wish } from '@u7-scl/wish/domain';
import { buttons } from '../../shared/buttons';
import { Routes } from '../../shared/routes';
import { resolveCourseNavLevel } from '../course-nav-resolver';

/**
 * Story «Программы курсов» — каталог учебных курсов школы.
 * Доступна всем ролям.
 *
 * Единая иерархия drill-down (курс → этап → модуль → проект → урок)
 * на базе presenter'а content-nav.
 */
export class CourseCatalogStory extends U7BotUiStory {
  readonly name = 'course-catalog';

  // ── Главное меню (декларативные кнопки) ──

  override async menuButtons(_actor: User): Promise<MenuButton[]> {
    return [
      {
        kind: 'callback',
        text: '📖 Курсы',
        action: this.cb('list'),
        priority: 12,
        description: '📖 Курсы — каталог учебных курсов и их структура',
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
      case 'course':
        return this.#handleCourse(ids[0], actor);
      case 'phase':
        return this.#handlePhase(ids[0] ?? '', Number(ids[1]));
      case 'phases':
        // Совместимость со старыми колбэками: phases:<courseId> -> карточка курса
        return this.#handleCourse(ids[0], actor);
      case 'module':
        return this.#handleModule(ids[0] ?? '', Number(ids[1]), ids[2] ?? '');
      case 'modules':
        // Совместимость со старыми колбэками: modules:<courseId>:<phaseIdx> -> карточка этапа
        return this.#handlePhase(ids[0] ?? '', Number(ids[1]));
      case 'project':
        return this.#handleProject(
          ids[0] ?? '',
          Number(ids[1]),
          ids[2] ?? '',
          ids[3] ?? '',
        );
      case 'projects':
        // Совместимость: projects:<courseId>:<phaseIdx>:<modId> -> карточка модуля
        return this.#handleModule(ids[0] ?? '', Number(ids[1]), ids[2] ?? '');
      case 'lesson':
        return this.#handleLesson(
          ids[0] ?? '',
          Number(ids[1]),
          ids[2] ?? '',
          ids[3] ?? '',
          ids[4] ?? '',
        );
      case 'lessons':
        // Совместимость: lessons:<courseId>:<phaseIdx>:<modId>:<projId> -> карточка проекта
        return this.#handleProject(
          ids[0] ?? '',
          Number(ids[1]),
          ids[2] ?? '',
          ids[3] ?? '',
        );
      case 'wish':
        return this.#handleWishModule(ids[0] ?? '', actor);
      case 'apply':
        return this.#handleApply(ids[0] ?? '', actor);
      case 'cancel':
        // W05 — экран подтверждения отмены желания курса
        return this.confirm(
          'cancel',
          ids[0] ?? '',
          md`Отменить желание пройти курс?`,
          {
            cancelCode: this.cb('course', ids[0] ?? ''),
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

  // ═══ Уровень 0: Курс (карточка курса + этапы подуровнем) ═══

  async #handleCourse(
    courseId: string | undefined,
    actor: User,
  ): Promise<DialogResponse> {
    const courses = await this.#loadCourses();
    if (courses.length === 0) {
      if (courseId) {
        return this.screen(md`⚠️ Курс не найден или недоступен`);
      }
      return this.screen(
        md`📖 *Курсы*\\n\\nПока нет доступных курсов\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    }

    const currentCourse = courseId
      ? courses.find((c) => c.uuid === courseId)
      : courses[0];

    if (!currentCourse) {
      return this.screen(md`⚠️ Курс не найден или недоступен`);
    }

    const allModIds = currentCourse.phases.flatMap((p) => p.moduleIds ?? []);
    const modulesInfo = await this.#loadModulesInfo(allModIds);

    const wishes = ((await this.appApi.execute(
      'list-user-wishes',
      {},
      actor,
    )) ?? []) as Wish[];
    const wishStatus = wishes.find(
      (w) =>
        w.target.kind === 'course' && w.target.courseId === currentCourse.uuid,
    )?.status;

    const navLevel = resolveCourseNavLevel({
      level: 'course',
      courses,
      currentCourseId: currentCourse.uuid,
      modulesInfo,
      wishStatus,
    });

    if (!navLevel) {
      return this.screen(md`⚠️ Курс не найден или недоступен`);
    }

    const { text, keyboard } = presentNavLevel(navLevel);
    return this.screen(text, keyboard);
  }

  // ═══ Уровень 1: Этап (карточка этапа + модули подуровнем) ═══

  async #handlePhase(
    courseId: string,
    phaseIdx: number,
  ): Promise<DialogResponse> {
    if (!courseId) {
      return this.screen(md`⚠️ Курс не указан`);
    }

    const courses = await this.#loadCourses();
    const course = courses.find((c) => c.uuid === courseId);
    if (!course) {
      return this.screen(md`⚠️ Курс не найден или недоступен`);
    }

    const phase = course.phases[phaseIdx];
    if (!phase) {
      return this.screen(md`⚠️ Этап не найден или недоступен`);
    }

    const modulesInfo = await this.#loadModulesInfo(phase.moduleIds ?? []);

    const navLevel = resolveCourseNavLevel({
      level: 'phase',
      courses,
      currentCourseId: courseId,
      phaseIdx,
      modulesInfo,
    });

    if (!navLevel) {
      return this.screen(md`⚠️ Этап не найден или недоступен`);
    }

    const { text, keyboard } = presentNavLevel(navLevel);
    return this.screen(text, keyboard);
  }

  // ═══ Уровень 2: Модуль (карточка модуля + проекты подуровнем) ═══

  async #handleModule(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
  ): Promise<DialogResponse> {
    if (!moduleId) {
      return this.screen(md`⚠️ Модуль не указан`);
    }

    const courses = await this.#loadCourses();
    const course = courses.find((c) => c.uuid === courseId);
    if (!course) {
      return this.screen(md`⚠️ Курс не найден или недоступен`);
    }

    let snapshot: ContentSnapshot;
    try {
      snapshot = (await this.appApi.execute('get-module-snapshot', {
        moduleId,
      })) as ContentSnapshot;
    } catch {
      return this.screen(md`⚠️ Модуль не найден или недоступен`);
    }

    let modTitle = `Модуль ${moduleId.slice(0, 8)}`;
    try {
      const mod = (await this.appApi.execute('get-module', {
        uuid: moduleId,
      })) as { title: string };
      if (mod?.title) modTitle = mod.title;
    } catch {
      // fallback
    }

    const navLevel = resolveCourseNavLevel({
      level: 'module',
      courses,
      currentCourseId: courseId,
      phaseIdx,
      moduleId,
      modulesInfo: { [moduleId]: { title: modTitle } },
      moduleSnapshot: snapshot,
    });

    if (!navLevel) {
      return this.screen(md`⚠️ Модуль не найден или недоступен`);
    }

    const { text, keyboard } = presentNavLevel(navLevel);
    return this.screen(text, keyboard);
  }

  // ═══ Уровень 3: Проект (карточка проекта + уроки подуровнем) ═══

  async #handleProject(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
    projectId: string,
  ): Promise<DialogResponse> {
    const courses = await this.#loadCourses();
    const course = courses.find((c) => c.uuid === courseId);
    if (!course) {
      return this.screen(md`⚠️ Курс не найден или недоступен`);
    }

    let snapshot: ContentSnapshot;
    try {
      snapshot = (await this.appApi.execute('get-module-snapshot', {
        moduleId,
      })) as ContentSnapshot;
    } catch {
      return this.screen(md`⚠️ Модуль не найден или недоступен`);
    }

    const project = snapshot.find((p) => p.projectId === projectId);
    if (!project) {
      return this.screen(md`⚠️ Проект не найден`);
    }

    let modTitle = `Модуль ${moduleId.slice(0, 8)}`;
    try {
      const mod = (await this.appApi.execute('get-module', {
        uuid: moduleId,
      })) as { title: string };
      if (mod?.title) modTitle = mod.title;
    } catch {
      // fallback
    }

    const lessonIds = project.lessons.map((l) => l.lessonId);
    const stepTitles = await this.#loadStepTitles(lessonIds);

    const navLevel = resolveCourseNavLevel({
      level: 'project',
      courses,
      currentCourseId: courseId,
      phaseIdx,
      moduleId,
      projectId,
      modulesInfo: { [moduleId]: { title: modTitle } },
      moduleSnapshot: snapshot,
      stepTitles,
    });

    if (!navLevel) {
      return this.screen(md`⚠️ Проект не найден`);
    }

    const { text, keyboard } = presentNavLevel(navLevel);
    return this.screen(text, keyboard);
  }

  // ═══ Уровень 4: Урок (шаги только заголовками, закрытый уровень) ═══

  async #handleLesson(
    courseId: string,
    phaseIdx: number,
    moduleId: string,
    projectId: string,
    lessonId: string,
  ): Promise<DialogResponse> {
    const courses = await this.#loadCourses();
    const course = courses.find((c) => c.uuid === courseId);
    if (!course) {
      return this.screen(md`⚠️ Курс не найден или недоступен`);
    }

    let snapshot: ContentSnapshot;
    try {
      snapshot = (await this.appApi.execute('get-module-snapshot', {
        moduleId,
      })) as ContentSnapshot;
    } catch {
      return this.screen(md`⚠️ Модуль не найден или недоступен`);
    }

    const project = snapshot.find((p) => p.projectId === projectId);
    if (!project) {
      return this.screen(md`⚠️ Проект не найден`);
    }

    const lesson = project.lessons.find((l) => l.lessonId === lessonId);
    if (!lesson) {
      return this.screen(md`⚠️ Урок не найден`);
    }

    let modTitle = `Модуль ${moduleId.slice(0, 8)}`;
    try {
      const mod = (await this.appApi.execute('get-module', {
        uuid: moduleId,
      })) as { title: string };
      if (mod?.title) modTitle = mod.title;
    } catch {
      // fallback
    }

    const stepTitles = await this.#loadStepTitles([lessonId]);

    const navLevel = resolveCourseNavLevel({
      level: 'lesson',
      courses,
      currentCourseId: courseId,
      phaseIdx,
      moduleId,
      projectId,
      lessonId,
      modulesInfo: { [moduleId]: { title: modTitle } },
      moduleSnapshot: snapshot,
      stepTitles,
    });

    if (!navLevel) {
      return this.screen(md`⚠️ Урок не найден`);
    }

    const { text, keyboard } = presentNavLevel(navLevel);
    return this.screen(text, keyboard);
  }

  // ── Желание пройти курс (кнопка из карточки курса) ──

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
        return {};
      }

      return this.screen(
        md`🎯 Твоё желание пройти курс зафиксировано\\!\n\nМы напишем тебе, когда откроется набор на этот курс\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    } catch (err) {
      if (fromError(err).kind === 'conflict') {
        const status =
          (fromError(err).payload as { status?: string } | undefined)?.status ??
          'expressed';

        if (status === 'pending') {
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
      if (fromError(err).kind === 'conflict') {
        return this.screen(
          md`ℹ️ Ты уже записан на этот модуль — ждём открытия набора\\.`,
          this.kb([[buttons.mainMenu()]]),
        );
      }
      return this.errorNotify(err);
    }
  }

  // ── Отмена желания курса (W05) ──

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
      if (fromError(err).kind === 'not-found') {
        return this.screen(
          md`ℹ️ Активного желания на этот курс уже нет\\.`,
          this.kb([[buttons.mainMenu()]]),
        );
      }
      return this.errorNotify(err);
    }
  }

  // ── Отмена желания модуля (W05-M) ──

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
      if (fromError(err).kind === 'not-found') {
        return this.screen(
          md`ℹ️ Активного желания на этот модуль уже нет\\.`,
          this.kb([[buttons.mainMenu()]]),
        );
      }
      return this.errorNotify(err);
    }
  }

  // ═══ Загрузка доменных данных ═══

  async #loadCourses(): Promise<Course[]> {
    return ((await this.appApi.execute('list-courses', {})) ?? []) as Course[];
  }

  async #loadModulesInfo(moduleIds: string[]): Promise<
    Record<
      string,
      {
        title: string;
        projectCount?: number;
        lessonCount?: number;
        projects?: Array<{ title: string; lessonCount?: number }>;
        projectTitles?: string[];
      }
    >
  > {
    const result: Record<
      string,
      {
        title: string;
        projectCount?: number;
        lessonCount?: number;
        projects?: Array<{ title: string; lessonCount?: number }>;
        projectTitles?: string[];
      }
    > = {};

    for (const modId of moduleIds) {
      let modTitle = `Модуль ${modId.slice(0, 8)}`;
      let projects: Array<{ title: string; lessonCount?: number }> = [];

      try {
        const mod = (await this.appApi.execute('get-module', {
          uuid: modId,
        })) as {
          title: string;
          projects?: Array<{ title?: string; lessonIds?: string[] }>;
        };
        if (mod?.title) modTitle = mod.title;
        if (mod?.projects) {
          projects = mod.projects.map((p) => ({
            title: p.title ?? 'Проект',
            lessonCount: p.lessonIds?.length ?? 0,
          }));
        }
      } catch {
        // fallback
      }

      try {
        const snapshot = (await this.appApi.execute('get-module-snapshot', {
          moduleId: modId,
        })) as ContentSnapshot;
        if (Array.isArray(snapshot) && snapshot.length > 0) {
          projects = snapshot.map((p) => ({
            title: p.projectTitle,
            lessonCount: p.lessons?.length ?? 0,
          }));
        }
      } catch {
        // fallback
      }

      const projectCount = projects.length;
      const lessonCount = projects.reduce(
        (sum, p) => sum + (p.lessonCount ?? 0),
        0,
      );

      result[modId] = {
        title: modTitle,
        projectCount,
        lessonCount,
        projects,
        projectTitles: projects.map((p) => p.title),
      };
    }

    return result;
  }

  async #loadStepTitles(lessonIds: string[]): Promise<Record<string, string>> {
    if (lessonIds.length === 0) return {};
    try {
      const stepsMap = (await this.appApi.execute('get-steps-by-lessons', {
        lessonIds,
      })) as Record<string, Array<{ uuid: string; description: string }>>;

      const result: Record<string, string> = {};
      for (const steps of Object.values(stepsMap ?? {})) {
        for (const step of steps ?? []) {
          result[step.uuid] = step.description;
        }
      }
      return result;
    } catch {
      return {};
    }
  }
}
