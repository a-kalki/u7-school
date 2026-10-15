import type {
  KbButton,
  NavChild,
  NavLevel,
  NavSubChild,
} from '@u7-scl/core/ui';
import type { Course } from '@u7-scl/course/domain';
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
        emoji: '🗂️',
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
        address: 'menu:root',
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
        title,
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

  return null;
}
