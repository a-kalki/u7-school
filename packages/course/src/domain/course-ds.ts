import { Status } from './status';
import type { ModuleAr } from './module/a-root';
import { LessonAr } from './lesson/a-root';
import type { CreateLessonCmd } from './lesson/commands/create-lesson-cmd';
import type { Lesson } from './lesson/entity';
import { StepAr } from './step/a-root';
import type { CreateStepCmd } from './step/commands/create-step-cmd';
import type { Module } from './module/entity';
import type { ContentSnapshot } from './types';

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

  /**
   * Собирает полный снимок контента модуля: проекты → уроки → stepIds.
   * Используется для передачи структуры модуля в stream.
   */
  buildSnapshot(module: Module, lessons: Lesson[]): ContentSnapshot {
    // Только опубликованные проекты
    return module.projects
      .filter((p) => p.status === Status.PUBLISHED)
      .map((project) => {
        const projectLessons = project.lessonIds
          .map((lessonId) => lessons.find((l) => l.uuid === lessonId))
          .filter((l): l is Lesson => l !== undefined)
          // Только опубликованные уроки
          .filter((l) => l.status === Status.PUBLISHED)
          .map((lesson) => ({
            lessonId: lesson.uuid,
            lessonTitle: lesson.title,
            stepIds: lesson.stepIds,
          }));

        return {
          projectId: project.uuid,
          projectTitle: project.title,
          lessons: projectLessons,
        };
      });
  }
}
