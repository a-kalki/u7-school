import type { ContentSnapshot } from './content-snapshot';
import type { CourseProgram } from './course/commands/get-course-program-cmd';
import type { Course } from './course/entity';
import type { Module } from './module/entity';
import type { Step } from './step/entity';

export type { CourseProgram };

/** Место модуля в программе курса (линейный порядок фаз). */
export interface ModulePlace {
  courseId: string;
  isFirst: boolean;
  isLast: boolean;
  prevModuleId?: string;
  nextModuleId?: string;
}

/**
 * Фасад модуля курсов для доступа из других модулей.
 *
 * Имена методов — вопросительные доменные запросы: вопросы «доступен ли курс»,
 * «какой модуль стартовый», «место модуля в программе», «та же ли это история
 * модуля» задаются только этому модулю.
 */
export interface CourseFacade {
  /** Получить снимок контента модуля */
  getModuleSnapshot(moduleId: string): Promise<ContentSnapshot>;

  /** Получить шаг по UUID */
  getStep(stepId: string): Promise<Step>;

  /** Получить программу курса (агрегация снимков модулей по фазам) */
  getCourseProgram(courseId: string): Promise<CourseProgram>;

  /** Получить курс по UUID (undefined, если курс не существует) */
  getCourse(courseId: string): Promise<Course | undefined>;

  /** Найти курс, содержащий указанный модуль */
  getCourseByModuleId(moduleId: string): Promise<Course | undefined>;

  /**
   * Доступен ли курс для записи студентом: существует и опубликован.
   * Статус курса — внутренняя кухня модуля курсов.
   */
  isCourseEnrollable(courseId: string): Promise<boolean>;

  /**
   * ID стартового (первого в линейном порядке фаз) модуля курса.
   * undefined — курс не существует или программа пуста.
   */
  getCourseStartModuleId(courseId: string): Promise<string | undefined>;

  /**
   * Место модуля в программе курса (опубликованного; при форках — приоритет
   * опубликованному курсу). undefined — модуль не входит ни в один
   * опубликованный курс.
   */
  getModulePlace(moduleId: string): Promise<ModulePlace | undefined>;

  /**
   * Историческая идентичность модулей: копия модуля с другим id — тот же
   * модуль. Сегодня реализация тривиальна (равенство id), контракт — на
   * будущее (версионность/копии модулей).
   */
  isSameModule(moduleIdA: string, moduleIdB: string): Promise<boolean>;

  /**
   * Какие из courseIds включают модуль в свою программу — в т.ч.
   * исторически (форки, архивные курсы).
   * Возвращает uuid тех из courseIds, которым модуль принадлежит.
   */
  whichCoursesIncludeModule(
    moduleId: string,
    courseIds: string[],
  ): Promise<string[]>;

  /** Получить модуль */
  getModule(moduleId: string): Promise<Module>;
}
