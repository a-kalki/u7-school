import type { NotFoundError } from '@u7-scl/core/domain';
import * as v from 'valibot';

/** Схема команды resolve-content-path */
export const ResolveContentPathSchema = v.pipe(
  v.object({
    path: v.optional(
      v.pipe(v.string(), v.minLength(1, 'path не может быть пустым')),
    ),
    stepId: v.optional(v.string()),
    streamId: v.optional(v.string()),
    courseId: v.optional(v.string()),
  }),
  v.check(
    (input) => !!input.path || !!input.stepId,
    'Необходимо указать path или stepId',
  ),
  v.check(
    (input) => !!input.streamId || !!input.courseId,
    'Необходимо указать streamId или courseId',
  ),
);

/** Команда resolve-content-path */
export type ResolveContentPathCmd = v.InferOutput<
  typeof ResolveContentPathSchema
>;

/** Ошибки команды resolve-content-path */
export type ResolveContentPathCmdError =
  | InvalidContentPathUcError
  | ModuleNotFoundInPathUcError
  | ProjectNotFoundInPathUcError
  | LessonNotFoundInPathUcError
  | StepNotFoundInPathUcError;

export type InvalidContentPathUcError = NotFoundError<
  'INVALID_CONTENT_PATH',
  undefined
>;

export type ModuleNotFoundInPathUcError = NotFoundError<
  'MODULE_NOT_FOUND',
  { moduleIndex: number } | undefined
>;

export type ProjectNotFoundInPathUcError = NotFoundError<
  'PROJECT_NOT_FOUND',
  { projectIndex: number } | undefined
>;

export type LessonNotFoundInPathUcError = NotFoundError<
  'LESSON_NOT_FOUND',
  { lessonIndex: number } | undefined
>;

export type StepNotFoundInPathUcError = NotFoundError<
  'STEP_NOT_FOUND',
  { stepIndex: number } | undefined
>;

/** Мета команды resolve-content-path */
export interface ResolveContentPathCmdMeta {
  ucName: 'resolve-content-path';
  arMeta: { name: 'Course'; label: 'Курс' };
  input: ResolveContentPathCmd;
  output: unknown;
  errors: ResolveContentPathCmdError;
  requiresAuth: false;
  type: 'query';
}
