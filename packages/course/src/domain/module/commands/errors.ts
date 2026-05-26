import type { AccessDeniedError, NotFoundError } from '@u7-scl/core/domain';
import type { UserNotFoundUcError } from '@u7-scl/user/domain';

/** Модуль не найден */
export type ModuleNotFoundUcError = NotFoundError<
  'MODULE_NOT_FOUND',
  { uuid?: string } | undefined
>;

/** Доступ запрещён */
export type ModuleAccessDeniedUcError = AccessDeniedError<
  'MODULE_ACCESS_DENIED',
  undefined
>;

/** Любая известная ошибка course-модуля */
export type CourseModuleError =
  | UserNotFoundUcError
  | ModuleNotFoundUcError
  | ModuleAccessDeniedUcError;
