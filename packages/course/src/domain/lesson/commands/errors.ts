import type { AccessDeniedError, NotFoundError } from '@u7-scl/core/domain';
import type {
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from '../../module/commands/errors';

/** Урок не найден */
export type LessonNotFoundUcError = NotFoundError<
  'LESSON_NOT_FOUND',
  { uuid?: string } | undefined
>;

/** Доступ запрещён */
export type LessonAccessDeniedUcError = AccessDeniedError<
  'LESSON_ACCESS_DENIED',
  undefined
>;

/** Любая известная ошибка lesson-модуля */
export type LessonModuleError =
  | LessonNotFoundUcError
  | LessonAccessDeniedUcError
  | ModuleNotFoundUcError
  | ModuleAccessDeniedUcError;
