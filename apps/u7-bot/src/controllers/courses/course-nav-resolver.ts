import type {
  KbButton,
  NavChild,
  NavLevel,
  NavSubChild,
} from '@u7-scl/core/ui';
import type { ContentSnapshot, Course } from '@u7-scl/course/domain';
import { Routes } from '../shared/routes';

export interface ModuleNavInfo {
  title: string;
  projectTitles?: string[];
}

export type CourseNavLevelKind =
  | 'course'
  | 'phase'
  | 'module'
  | 'project'
  | 'lesson';

export interface ResolveCourseNavLevelParams {
  level: CourseNavLevelKind;
  courses: Course[];
  currentCourseId: string;
  phaseIdx?: number;
  moduleId?: string;
  projectId?: string;
  lessonId?: string;
  modulesInfo?: Record<string, ModuleNavInfo>;
  moduleSnapshot?: ContentSnapshot;
  stepTitles?: Record<string, string>;
  wishStatus?: string;
  storyPrefix?: string;
}

/**
 * Склонение существительных после числительных в русском языке.
 */
function plural(n: number, one: string, two: string, five: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return five;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return two;
  return five;
}

/**
 * Формирует ряд wish-кнопок для карточки курса.
 */
function buildCourseWishRows(
  courseId: string,
  wishStatus: string | undefined,
  storyPrefix: string,
): KbButton[][] {
  if (wishStatus === 'pending') {
    return [
      [
        {
          text: '📝 Продолжить анкету',
          code: Routes.questionnaire.resume(courseId),
        },
      ],
    ];
  }
  if (wishStatus === 'expressed' || wishStatus === 'confirmed') {
    return [
      [
        {
          text: '🗑️ Отменить желание',
          code: `${storyPrefix}:cancel:${courseId}`,
        },
      ],
    ];
  }
  return [
    [
      {
        text: '🎓 Хочу пройти курс',
        code: `${storyPrefix}:apply:${courseId}`,
      },
    ],
  ];
}

/**
 * Резолвит карточку NavLevel для каталога курсов.
 * Чистая функция без побочных эффектов.
 */
export function resolveCourseNavLevel(
  params: ResolveCourseNavLevelParams,
): NavLevel | null {
  const {
    level,
    courses,
    currentCourseId,
    phaseIdx,
    modulesInfo = {},
    wishStatus,
    storyPrefix = 'course-catalog',
  } = params;

  const courseIndex = courses.findIndex((c) => c.uuid === currentCourseId);
  const course = courses[courseIndex];
  if (!course) return null;

  // ── Уровень 0: Курс (уровень корня каталога) ──
  if (level === 'course') {
    const phaseCount = course.phases.length;
    const subtitle = `Курс состоит из ${phaseCount} этап${plural(phaseCount, 'а', 'ов', 'ов')}`;

    const children: NavChild[] = course.phases.map((phase, pIdx) => {
      const subChildren: NavSubChild[] = (phase.moduleIds ?? []).map(
        (modId) => {
          const modInfo = modulesInfo[modId];
          const title = modInfo?.title ?? `Модуль ${modId.slice(0, 8)}...`;
          return {
            id: modId,
            title: `Модуль: ${title}`,
            emoji: '📦',
          };
        },
      );

      return {
        id: `phase-${pIdx}`,
        index: pIdx + 1,
        title: `Этап: ${phase.title}`,
        emoji: '🏛',
        enterable: true,
        address: `${storyPrefix}:phase:${course.uuid}:${pIdx}`,
        children: subChildren,
      };
    });

    const prevCourse = courses[courseIndex - 1];
    const nextCourse = courses[courseIndex + 1];

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: ['📖 Курсы', `Курс: ${course.title}`],
      subtitle,
      children,
      extraRows: buildCourseWishRows(course.uuid, wishStatus, storyPrefix),
      prev: prevCourse
        ? {
            label: '◀️ Пред. курс',
            address: `${storyPrefix}:course:${prevCourse.uuid}`,
          }
        : undefined,
      next: nextCourse
        ? {
            label: 'След. курс ▶️',
            address: `${storyPrefix}:course:${nextCourse.uuid}`,
          }
        : undefined,
      back: {
        label: '↩️ Главное меню',
        address: Routes.app.mainMenu,
      },
    };
  }

  // ── Уровень 1: Этап ──
  if (level === 'phase') {
    const currentPhaseIdx = phaseIdx ?? 0;
    const phase = course.phases[currentPhaseIdx];
    if (!phase) return null;

    const modCount = phase.moduleIds?.length ?? 0;
    const subtitle = `Этап состоит из ${modCount} модул${plural(modCount, 'я', 'ей', 'ей')}`;

    const children: NavChild[] = (phase.moduleIds ?? []).map((modId, mIdx) => {
      const modInfo = modulesInfo[modId];
      const title = modInfo?.title ?? `Модуль ${modId.slice(0, 8)}...`;
      const subChildren: NavSubChild[] = (modInfo?.projectTitles ?? []).map(
        (pTitle) => ({
          title: `Проект: ${pTitle}`,
          emoji: '📁',
        }),
      );

      return {
        id: modId,
        index: mIdx + 1,
        title: `Модуль: ${title}`,
        emoji: '📦',
        enterable: true,
        address: `${storyPrefix}:module:${course.uuid}:${currentPhaseIdx}:${modId}`,
        children: subChildren,
      };
    });

    const prevPhase = course.phases[currentPhaseIdx - 1];
    const nextPhase = course.phases[currentPhaseIdx + 1];

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Курсы',
        `Курс: ${course.title}`,
        `Этап: ${phase.title}`,
      ],
      subtitle,
      children,
      prev: prevPhase
        ? {
            label: '◀️ Пред. этап',
            address: `${storyPrefix}:phase:${course.uuid}:${currentPhaseIdx - 1}`,
          }
        : undefined,
      next: nextPhase
        ? {
            label: 'След. этап ▶️',
            address: `${storyPrefix}:phase:${course.uuid}:${currentPhaseIdx + 1}`,
          }
        : undefined,
      back: {
        label: '⬅️ Назад к курсу',
        address: `${storyPrefix}:course:${course.uuid}`,
      },
    };
  }

  // ── Уровень 2: Модуль ──
  if (level === 'module') {
    const currentPhaseIdx = phaseIdx ?? 0;
    const phase = course.phases[currentPhaseIdx];
    if (!phase) return null;

    if (!params.moduleId || !params.moduleSnapshot) return null;
    const modId = params.moduleId;
    const modIndex = phase.moduleIds?.indexOf(modId) ?? -1;
    if (modIndex === -1) return null;

    const modInfo = modulesInfo[modId];
    const moduleTitle = modInfo?.title ?? `Модуль ${modId.slice(0, 8)}...`;
    const snapshot = params.moduleSnapshot;

    const projectCount = snapshot.length;
    const subtitle = `Модуль состоит из ${projectCount} проект${plural(projectCount, 'а', 'ов', 'ов')}`;

    const children: NavChild[] = snapshot.map((p, pIdx) => {
      const subChildren: NavSubChild[] = p.lessons.map((l) => ({
        id: l.lessonId,
        title: `Урок: ${l.lessonTitle}`,
        emoji: '📝',
      }));

      return {
        id: p.projectId,
        index: pIdx + 1,
        title: `Проект: ${p.projectTitle}`,
        emoji: '📁',
        enterable: true,
        address: `${storyPrefix}:project:${modId}:${p.projectId}`,
        children: subChildren,
      };
    });

    const prevModId = phase.moduleIds?.[modIndex - 1];
    const nextModId = phase.moduleIds?.[modIndex + 1];

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Курсы',
        `Курс: ${course.title}`,
        `Этап: ${phase.title}`,
        `Модуль: ${moduleTitle}`,
      ],
      subtitle,
      children,
      prev: prevModId
        ? {
            label: '◀️ Пред. модуль',
            address: `${storyPrefix}:module:${course.uuid}:${currentPhaseIdx}:${prevModId}`,
          }
        : undefined,
      next: nextModId
        ? {
            label: 'След. модуль ▶️',
            address: `${storyPrefix}:module:${course.uuid}:${currentPhaseIdx}:${nextModId}`,
          }
        : undefined,
      back: {
        label: '⬅️ Назад к этапу',
        address: `${storyPrefix}:phase:${course.uuid}:${currentPhaseIdx}`,
      },
    };
  }

  // ── Уровень 3: Проект ──
  if (level === 'project') {
    const currentPhaseIdx = phaseIdx ?? 0;
    const phase = course.phases[currentPhaseIdx];
    if (!phase) return null;

    if (!params.moduleId || !params.projectId || !params.moduleSnapshot) {
      return null;
    }
    const modId = params.moduleId;
    const modInfo = modulesInfo[modId];
    const moduleTitle = modInfo?.title ?? `Модуль ${modId.slice(0, 8)}...`;
    const snapshot = params.moduleSnapshot;

    const projectIndex = snapshot.findIndex(
      (p) => p.projectId === params.projectId,
    );
    if (projectIndex === -1) return null;
    const project = snapshot[projectIndex];
    if (!project) return null;

    const lessonCount = project.lessons.length;
    const subtitle = `Проект состоит из ${lessonCount} урок${plural(lessonCount, 'а', 'ов', 'ов')}`;

    const children: NavChild[] = project.lessons.map((l, lIdx) => {
      const subChildren: NavSubChild[] = l.stepIds.map((sId, sIdx) => {
        const title = params.stepTitles?.[sId] ?? `Шаг ${sIdx + 1}`;
        return {
          id: sId,
          title: title.startsWith('Шаг') ? title : `Шаг: ${title}`,
          emoji: '📄',
        };
      });

      return {
        id: l.lessonId,
        index: lIdx + 1,
        title: `Урок: ${l.lessonTitle}`,
        emoji: '📝',
        enterable: true,
        address: `${storyPrefix}:lesson:${modId}:${project.projectId}:${l.lessonId}`,
        children: subChildren,
      };
    });

    const prevProject = snapshot[projectIndex - 1];
    const nextProject = snapshot[projectIndex + 1];

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Курсы',
        `Курс: ${course.title}`,
        `Этап: ${phase.title}`,
        `Модуль: ${moduleTitle}`,
        `Проект: ${project.projectTitle}`,
      ],
      subtitle,
      children,
      prev: prevProject
        ? {
            label: '◀️ Пред. проект',
            address: `${storyPrefix}:project:${modId}:${prevProject.projectId}`,
          }
        : undefined,
      next: nextProject
        ? {
            label: 'След. проект ▶️',
            address: `${storyPrefix}:project:${modId}:${nextProject.projectId}`,
          }
        : undefined,
      back: {
        label: '⬅️ Назад к модулю',
        address: `${storyPrefix}:module:${course.uuid}:${currentPhaseIdx}:${modId}`,
      },
    };
  }

  // ── Уровень 4: Урок (шаги только заголовками, закрытый уровень) ──
  if (level === 'lesson') {
    const currentPhaseIdx = phaseIdx ?? 0;
    const phase = course.phases[currentPhaseIdx];
    if (!phase) return null;

    if (
      !params.moduleId ||
      !params.projectId ||
      !params.lessonId ||
      !params.moduleSnapshot
    ) {
      return null;
    }
    const modId = params.moduleId;
    const modInfo = modulesInfo[modId];
    const moduleTitle = modInfo?.title ?? `Модуль ${modId.slice(0, 8)}...`;
    const snapshot = params.moduleSnapshot;

    const project = snapshot.find((p) => p.projectId === params.projectId);
    if (!project) return null;

    const lessonIndex = project.lessons.findIndex(
      (l) => l.lessonId === params.lessonId,
    );
    if (lessonIndex === -1) return null;
    const lesson = project.lessons[lessonIndex];
    if (!lesson) return null;

    const stepCount = lesson.stepIds.length;
    const subtitle = `Урок состоит из ${stepCount} шаг${plural(stepCount, 'а', 'ов', 'ов')}`;

    const children: NavChild[] = lesson.stepIds.map((sId, sIdx) => {
      const title = params.stepTitles?.[sId] ?? `Шаг ${sIdx + 1}`;
      return {
        id: sId,
        index: sIdx + 1,
        title: title.startsWith('Шаг') ? title : `Шаг: ${title}`,
        emoji: '📄',
        enterable: false,
      };
    });

    const prevLesson = project.lessons[lessonIndex - 1];
    const nextLesson = project.lessons[lessonIndex + 1];

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Курсы',
        `Курс: ${course.title}`,
        `Этап: ${phase.title}`,
        `Модуль: ${moduleTitle}`,
        `Проект: ${project.projectTitle}`,
        `Урок: ${lesson.lessonTitle}`,
      ],
      subtitle,
      children,
      prev: prevLesson
        ? {
            label: '◀️ Пред. урок',
            address: `${storyPrefix}:lesson:${modId}:${project.projectId}:${prevLesson.lessonId}`,
          }
        : undefined,
      next: nextLesson
        ? {
            label: 'След. урок ▶️',
            address: `${storyPrefix}:lesson:${modId}:${project.projectId}:${nextLesson.lessonId}`,
          }
        : undefined,
      back: {
        label: '⬅️ Назад к проекту',
        address: `${storyPrefix}:project:${modId}:${project.projectId}`,
      },
    };
  }

  return null;
}
