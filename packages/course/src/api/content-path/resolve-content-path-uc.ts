import { errNotFound } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import {
  parse as parseContentPath,
  serialize as serializeContentPath,
} from '#domain/content-path';
import type {
  LessonNotFoundInPathUcError,
  ModuleNotFoundInPathUcError,
  ProjectNotFoundInPathUcError,
  ResolveContentPathCmd,
  ResolveContentPathCmdMeta,
  StepNotFoundInPathUcError,
} from '#domain/content-path/commands/resolve-content-path-cmd';
import { ResolveContentPathSchema } from '#domain/content-path/commands/resolve-content-path-cmd';
import type { ContentSnapshot } from '#domain/content-snapshot';
import { CourseDs } from '#domain/course-ds';
import type { Lesson } from '#domain/lesson/entity';
import type { Step } from '#domain/step/entity';
import { CourseUseCase } from '../course-uc';

// ============================================================
// Output types
// ============================================================

export interface StepSummary {
  uuid: string;
  description: string;
  kind: string;
  content?: string;
  code?: string;
}

export interface ResolvedContent {
  path: string;
  moduleIndex: number;
  moduleTitle: string;
  projectIndex?: number;
  projectId?: string;
  projectTitle?: string;
  lessons?: { lessonId: string; lessonTitle: string }[];
  lessonIndex?: number;
  lessonId?: string;
  lessonTitle?: string;
  steps?: StepSummary[];
  step?: StepSummary;
}

const ResolvedContentSchema = v.any();

// ============================================================
// UC
// ============================================================

const FULL_ACCESS_ROLES: Role[] = [Role.MENTOR, Role.ADMIN, Role.AUTHOR];

interface ModuleSlot {
  title: string;
  snapshot: ContentSnapshot;
}

export class ResolveContentPathUc extends CourseUseCase<ResolveContentPathCmdMeta> {
  protected readonly ucName = 'resolve-content-path' as const;
  protected readonly ucLabel = 'Разрешить контент по пути' as const;
  protected readonly arMeta = {
    arName: 'Course' as const,
    arLabel: 'Курс' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ResolveContentPathSchema;
  protected readonly outputSchema = ResolvedContentSchema;

  async execute(
    command: ResolveContentPathCmd,
    actorId?: string,
  ): Promise<ResolvedContent> {
    const cp = parseContentPath(command.path);

    const slots = await this.buildProgram(command.courseId);

    const moduleIndex = cp.moduleIndex - 1;

    if (moduleIndex < 0 || moduleIndex >= slots.length) {
      this.throwError(
        errNotFound<ModuleNotFoundInPathUcError>(
          'MODULE_NOT_FOUND',
          'Модуль не найден',
          { moduleIndex: cp.moduleIndex },
        ),
      );
    }

    const slot = slots[moduleIndex];
    if (!slot) {
      this.throwError(
        errNotFound<ModuleNotFoundInPathUcError>(
          'MODULE_NOT_FOUND',
          'Модуль не найден',
          { moduleIndex: cp.moduleIndex },
        ),
      );
    }

    const actor = actorId ? await this.getUser(actorId, actorId) : undefined;
    const isFullAccess = this.hasFullAccess(actor);

    const result: ResolvedContent = {
      path: serializeContentPath(cp),
      moduleIndex: cp.moduleIndex,
      moduleTitle: slot.title,
    };

    if (cp.projectIndex === undefined) {
      return result;
    }

    const projectIndex = cp.projectIndex - 1;
    if (projectIndex < 0 || projectIndex >= slot.snapshot.length) {
      this.throwError(
        errNotFound<ProjectNotFoundInPathUcError>(
          'PROJECT_NOT_FOUND',
          'Проект не найден',
          { projectIndex: cp.projectIndex },
        ),
      );
    }

    const project = slot.snapshot[projectIndex];
    if (!project) {
      this.throwError(
        errNotFound<ProjectNotFoundInPathUcError>(
          'PROJECT_NOT_FOUND',
          'Проект не найден',
          { projectIndex: cp.projectIndex },
        ),
      );
    }

    result.projectIndex = cp.projectIndex;
    result.projectId = project.projectId;
    result.projectTitle = project.projectTitle;
    result.lessons = project.lessons.map(
      (l: { lessonId: string; lessonTitle: string }) => ({
        lessonId: l.lessonId,
        lessonTitle: l.lessonTitle,
      }),
    );

    if (cp.lessonIndex === undefined) {
      return result;
    }

    const lessonIndex = cp.lessonIndex - 1;
    if (lessonIndex < 0 || lessonIndex >= project.lessons.length) {
      this.throwError(
        errNotFound<LessonNotFoundInPathUcError>(
          'LESSON_NOT_FOUND',
          'Урок не найден',
          { lessonIndex: cp.lessonIndex },
        ),
      );
    }

    const lesson = project.lessons[lessonIndex];
    if (!lesson) {
      this.throwError(
        errNotFound<LessonNotFoundInPathUcError>(
          'LESSON_NOT_FOUND',
          'Урок не найден',
          { lessonIndex: cp.lessonIndex },
        ),
      );
    }

    result.lessonIndex = cp.lessonIndex;
    result.lessonId = lesson.lessonId;
    result.lessonTitle = lesson.lessonTitle;

    const stepIds = lesson.stepIds;
    let stepSummaries: StepSummary[] = [];
    try {
      const rawSteps = await Promise.all(
        stepIds.map(async (id: string) => {
          const s = await this.resolve.stepRepo.getByUuid(id);
          return s;
        }),
      );
      stepSummaries = rawSteps
        .filter((s: Step | undefined): s is Step => s !== undefined)
        .map((s: Step) => this.toSummary(s, isFullAccess));
    } catch {
      // stepRepo может выбросить — оставляем пустой массив
    }

    result.steps = stepSummaries;

    if (cp.stepIndex === undefined) {
      return result;
    }

    if (cp.stepIndex === 'all') {
      return result;
    }

    const stepNum = cp.stepIndex - 1;
    if (stepNum < 0 || stepNum >= stepSummaries.length) {
      this.throwError(
        errNotFound<StepNotFoundInPathUcError>(
          'STEP_NOT_FOUND',
          'Шаг не найден',
          { stepIndex: cp.stepIndex },
        ),
      );
    }

    const targetStep = stepSummaries[stepNum];
    if (!targetStep) {
      this.throwError(
        errNotFound<StepNotFoundInPathUcError>(
          'STEP_NOT_FOUND',
          'Шаг не найден',
          { stepIndex: cp.stepIndex },
        ),
      );
    }
    result.step = targetStep;

    return result;
  }

  /**
   * Строит плоский список слотов (фаза + модуль → ContentSnapshot).
   * Использует репозитории напрямую, без CourseFacade.
   */
  private async buildProgram(courseId?: string): Promise<ModuleSlot[]> {
    const course = await this.resolve.courseRepo.getByUuid(
      courseId || 'default',
    );
    if (!course) {
      this.throwError(
        errNotFound<ModuleNotFoundInPathUcError>(
          'MODULE_NOT_FOUND',
          'Модуль не найден',
          { moduleIndex: 1 },
        ),
      );
    }

    const ds = new CourseDs();
    const slots: ModuleSlot[] = [];

    for (const phase of course.phases) {
      for (const moduleId of phase.moduleIds) {
        const mod = await this.resolve.moduleRepo.getByUuid(moduleId);
        if (!mod) continue;

        const lessons: Lesson[] = [];
        const seen = new Set<string>();
        for (const project of mod.projects) {
          for (const lessonId of project.lessonIds) {
            if (seen.has(lessonId)) continue;
            seen.add(lessonId);
            const lesson = await this.resolve.lessonRepo.getByUuid(lessonId);
            if (lesson) lessons.push(lesson);
          }
        }

        const snapshot = ds.buildSnapshot(mod, lessons);
        slots.push({
          title: phase.title || `Фаза ${course.phases.indexOf(phase) + 1}`,
          snapshot,
        });
      }
    }

    return slots;
  }

  private hasFullAccess(actor?: { roles?: string[] }): boolean {
    if (!actor?.roles) return false;
    return actor.roles.some((r: string) =>
      FULL_ACCESS_ROLES.includes(r as Role),
    );
  }

  private toSummary(step: Step, isFullAccess: boolean): StepSummary {
    const base: StepSummary = {
      uuid: step.uuid,
      description: step.description,
      kind: step.kind,
    };
    if (isFullAccess) {
      base.content = step.content;
      if ('code' in step) {
        base.code = step.code;
      }
    }
    return base;
  }
}
