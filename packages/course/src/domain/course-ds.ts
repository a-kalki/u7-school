import type { ContentSnapshot, StepPosition } from './content-snapshot';
import { LessonAr } from './lesson/a-root';
import type { CreateLessonCmd } from './lesson/commands/create-lesson-cmd';
import type { Lesson } from './lesson/entity';
import type { ModuleAr } from './module/a-root';
import type { Module } from './module/entity';
import { Status } from './status';
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

  // ── Методы обхода ContentSnapshot ──

  /**
   * Находит позицию шага в снимке контента.
   * Индексы 1-based. Возвращает null если шаг не найден.
   */
  findStepPosition(
    snapshot: ContentSnapshot,
    stepId: string,
  ): StepPosition | null {
    for (let pi = 0; pi < snapshot.length; pi++) {
      const project = snapshot[pi];
      if (!project) continue;
      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson) continue;
        const idx = lesson.stepIds.indexOf(stepId);
        if (idx !== -1) {
          return {
            projectIndex: pi + 1,
            projectTitle: project.projectTitle,
            lessonIndex: li + 1,
            lessonTitle: lesson.lessonTitle,
            stepIndex: idx + 1,
            totalSteps: lesson.stepIds.length,
          };
        }
      }
    }
    return null;
  }

  /** Находит название урока по UUID */
  findLessonTitle(snapshot: ContentSnapshot, lessonId: string): string {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        if (lesson.lessonId === lessonId) {
          return lesson.lessonTitle;
        }
      }
    }
    return 'урок';
  }

  /** Находит название проекта по UUID */
  findProjectTitle(snapshot: ContentSnapshot, projectId: string): string {
    for (const project of snapshot) {
      if (project.projectId === projectId) {
        return project.projectTitle;
      }
    }
    return 'проект';
  }

  /** Подсчитывает общее число шагов во всём снимке */
  countTotalSteps(snapshot: ContentSnapshot): number {
    return snapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );
  }
}
