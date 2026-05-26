import type { ModuleAr } from './module/a-root';
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
   * Создаёт урок и добавляет его в проект модуля.
   * Если проект не найден — ModuleAr.addLessonToProject выбросит badRequest.
   */
  createLesson(
    module: ModuleAr,
    cmd: CreateLessonCmd,
    projectId: string,
  ): { module: ModuleAr; lesson: LessonAr } {
    const lesson = LessonAr.create(cmd);
    module.addLessonToProject(projectId, lesson.state.uuid);
    return { module, lesson };
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
