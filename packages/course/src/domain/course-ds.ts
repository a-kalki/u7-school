import type { CourseAr } from './course/a-root';
import { LessonAr } from './lesson/a-root';
import type { CreateLessonCmd } from './lesson/commands/create-lesson-cmd';
import { StepAr } from './step/a-root';
import type { CreateStepCmd } from './step/commands/create-step-cmd';

/**
 * Domain Service модуля курсов.
 * Координирует работу нескольких агрегатов.
 */
export class CourseDs {
  /**
   * Создаёт урок и добавляет его в проект курса.
   * Если проект не найден — CourseAr.addLessonToProject выбросит badRequest.
   */
  createLesson(
    course: CourseAr,
    cmd: CreateLessonCmd,
    projectId: string,
  ): { course: CourseAr; lesson: LessonAr } {
    const lesson = LessonAr.create(cmd);
    course.addLessonToProject(projectId, lesson.state.uuid);
    return { course, lesson };
  }

  /**
   * Создаёт шаг и добавляет его в урок.
   * Возвращает изменённые агрегаты для сохранения в БД.
   */
  createStep(
    lesson: LessonAr,
    cmd: CreateStepCmd,
  ): { lesson: LessonAr; step: StepAr } {
    const step = StepAr.create(cmd);
    lesson.addStep(step.state.uuid);

    return { lesson, step };
  }
}
