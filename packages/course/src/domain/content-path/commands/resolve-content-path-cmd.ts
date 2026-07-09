import * as v from 'valibot';

/** Схема команды resolve-content-path */
export const ResolveContentPathSchema = v.object({
  path: v.pipe(v.string(), v.minLength(1, 'path не может быть пустым')),
  streamId: v.optional(v.string()),
  courseId: v.optional(v.string()),
});

/** Команда resolve-content-path */
export type ResolveContentPathCmd = v.InferOutput<
  typeof ResolveContentPathSchema
>;

/** Мета команды resolve-content-path */
export interface ResolveContentPathCmdMeta {
  ucName: 'resolve-content-path';
  arMeta: { arName: 'Course'; arLabel: 'Курс' };
  input: ResolveContentPathCmd;
  output: unknown; // будет уточнён
  errors: ResolveContentPathCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды resolve-content-path */
export type ResolveContentPathCmdError =
  | 'INVALID_CONTENT_PATH'
  | 'MODULE_NOT_FOUND'
  | 'PROJECT_NOT_FOUND'
  | 'LESSON_NOT_FOUND'
  | 'STEP_NOT_FOUND';
