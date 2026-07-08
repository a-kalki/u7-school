import type { ContentSnapshot } from './content-snapshot';
import type { Course } from './course/entity';
import type { Step } from './step/entity';

/** Программа курса — агрегация снимков модулей по фазам */
export interface CourseProgram {
  course: Course;
  phases: {
    title: string;
    track?: string;
    modules: ContentSnapshot[];
  }[];
}

/**
 * Фасад модуля курсов для доступа из других модулей.
 */
export interface CourseFacade {
  /** Получить снимок контента модуля */
  getModuleSnapshot(moduleId: string): Promise<ContentSnapshot>;

  /** Получить шаг по UUID */
  getStep(stepId: string): Promise<Step>;

  /** Получить программу курса (агрегация снимков модулей по фазам) */
  getCourseProgram(courseId: string): Promise<CourseProgram>;
}
