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
import type { CourseFacade, CourseProgram } from '#domain/facade';
import type { Step } from '#domain/step/entity';
import { CourseUseCase } from '../course-uc';

// ============================================================
// Output types
// ============================================================

/** Сводка шага: зависит от роли (content/code опциональны) */
export interface StepSummary {
  uuid: string;
  description: string;
  kind: string;
  content?: string;
  code?: string;
}

/** Общий результат резолва */
export interface ResolvedContent {
  path: string;
  moduleIndex: number;
  moduleTitle: string;
  /** Присутствует если path включает projectIndex */
  projectIndex?: number;
  projectId?: string;
  projectTitle?: string;
  /** Присутствует на уровне проекта: список уроков (заголовки) */
  lessons?: { lessonId: string; lessonTitle: string }[];
  /** Присутствует если path включает lessonIndex */
  lessonIndex?: number;
  lessonId?: string;
  lessonTitle?: string;
  /** Присутствует если path — урок/шаг */
  steps?: StepSummary[];
  /** Присутствует если path указывает на конкретный шаг */
  step?: StepSummary;
}

/** Схема вывода */
const ResolvedContentSchema = v.any();

// ============================================================
// UC
// ============================================================

const FULL_ACCESS_ROLES: Role[] = [Role.MENTOR, Role.ADMIN, Role.AUTHOR];

/**
 * Use-case разрешения контента по ContentPath.
 * Вход: path + streamId/courseId.
 * Выход: структура контента с ролевым фильтром.
 */
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

  private get facade(): CourseFacade {
    return this.resolve.courseFacade as CourseFacade;
  }

  async execute(
    command: ResolveContentPathCmd,
    actorId?: string,
  ): Promise<ResolvedContent> {
    // Get course program
    const program: CourseProgram = await this.facade.getCourseProgram(
      command.courseId || 'default',
    );

    // Resolve path — either from explicit path or by stepId lookup
    let cp = command.path ? parseContentPath(command.path) : undefined;

    if (!cp && command.stepId) {
      cp = this.resolvePathByStepId(program, command.stepId) ?? undefined;
    }

    if (!cp) {
      this.throwError(
        errNotFound<ModuleNotFoundInPathUcError>(
          'MODULE_NOT_FOUND',
          'Не удалось определить позицию шага',
          undefined,
        ),
      );
    }

    return this.resolveFromContentPath(cp, program, actorId);
  }

  /** Ищет ContentPath по stepId (UUID) в программе курса */
  private resolvePathByStepId(
    program: CourseProgram,
    stepId: string,
  ): ReturnType<typeof parseContentPath> | null {
    const flatModules = program.phases.flatMap((p) => p.modules);

    for (let mi = 0; mi < flatModules.length; mi++) {
      const mod = flatModules[mi];
      if (!mod) continue;
      for (let pi = 0; pi < mod.length; pi++) {
        const proj = mod[pi];
        if (!proj) continue;
        for (let li = 0; li < proj.lessons.length; li++) {
          const les = proj.lessons[li];
          if (!les) continue;
          const si = les.stepIds.indexOf(stepId);
          if (si !== -1) {
            return parseContentPath(`${mi + 1}:${pi + 1}:${li + 1}:${si + 1}`);
          }
        }
      }
    }

    return null;
  }

  /** Ядро резолва по ContentPath */
  private async resolveFromContentPath(
    cp: ReturnType<typeof parseContentPath>,
    program: CourseProgram,
    actorId?: string,
  ): Promise<ResolvedContent> {
    // 3. Flatten modules across phases
    const flatModules = program.phases.flatMap((p) => p.modules);
    const moduleIndex = cp.moduleIndex - 1; // 0-based

    if (moduleIndex < 0 || moduleIndex >= flatModules.length) {
      this.throwError(
        errNotFound<ModuleNotFoundInPathUcError>(
          'MODULE_NOT_FOUND',
          'Модуль не найден',
          { moduleIndex: cp.moduleIndex },
        ),
      );
    }

    // 4. Determine module
    const targetPhase = this.findPhaseForModule(program, moduleIndex);
    const moduleTitle = targetPhase?.title || `Модуль ${cp.moduleIndex}`;
    const moduleSnapshot = flatModules[moduleIndex];

    if (!moduleSnapshot) {
      this.throwError(
        errNotFound<ModuleNotFoundInPathUcError>(
          'MODULE_NOT_FOUND',
          'Модуль не найден',
          { moduleIndex: cp.moduleIndex },
        ),
      );
    }

    // 5. Get actor & role
    const actor = actorId ? await this.getUser(actorId, actorId) : undefined;
    const isFullAccess = this.hasFullAccess(actor);

    // 6. Build result based on path depth
    const result: ResolvedContent = {
      path: serializeContentPath(cp),
      moduleIndex: cp.moduleIndex,
      moduleTitle,
    };

    // Level A: only module — return structure
    if (cp.projectIndex === undefined) {
      return result;
    }

    // Level A:B and deeper: resolve project
    const projectIndex = cp.projectIndex - 1;
    if (projectIndex < 0 || projectIndex >= moduleSnapshot.length) {
      this.throwError(
        errNotFound<ProjectNotFoundInPathUcError>(
          'PROJECT_NOT_FOUND',
          'Проект не найден',
          { projectIndex: cp.projectIndex },
        ),
      );
    }

    const project = moduleSnapshot[projectIndex];
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
    result.lessons = project.lessons.map((l) => ({
      lessonId: l.lessonId,
      lessonTitle: l.lessonTitle,
    }));

    if (cp.lessonIndex === undefined) {
      return result;
    }

    // Level A:B:C and deeper: resolve lesson
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

    // Fetch steps
    const stepIds = lesson.stepIds;
    let stepSummaries: StepSummary[] = [];
    try {
      const rawSteps = await Promise.all(
        stepIds.map((id) => this.facade.getStep(id)),
      );
      stepSummaries = rawSteps
        .filter((s): s is Step => s !== undefined)
        .map((s) => this.toSummary(s, isFullAccess));
    } catch {
      // getStep может отсутствовать — оставляем пустой массив
    }

    result.steps = stepSummaries;

    // Level A:B:C:D (specific step) or A:B:C:all
    if (cp.stepIndex === undefined) {
      return result;
    }

    if (cp.stepIndex === 'all') {
      return result; // all steps already in result.steps
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
    result.step = targetStep;

    return result;
  }

  /** Определяет, в какой фазе находится модуль по индексу */
  private findPhaseForModule(
    program: CourseProgram,
    moduleIndex: number,
  ): { title: string } | undefined {
    let cum = 0;
    for (const phase of program.phases) {
      const count = phase.modules?.length || 0;
      if (moduleIndex < cum + count) {
        const idx = program.phases.indexOf(phase) + 1;
        return { title: phase.title || `Фаза ${idx}` };
      }
      cum += count;
    }
    return undefined;
  }

  /** Проверяет, имеет ли пользователь полный доступ */
  private hasFullAccess(actor?: { roles?: string[] }): boolean {
    if (!actor?.roles) return false;
    return actor.roles.some((r) => FULL_ACCESS_ROLES.includes(r as Role));
  }

  /** Превращает Step в StepSummary с ролевым фильтром */
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
