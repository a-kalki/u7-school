import type { AccessDeniedError, NotFoundError } from '@u7-scl/core/domain';
import type { UserNotFoundUcError } from '@u7-scl/user/domain';

/** Курс не найден */
export type CourseNotFoundUcError = NotFoundError<
  'COURSE_NOT_FOUND',
  { uuid?: string } | undefined
>;

/** Доступ запрещён */
export type CourseAccessDeniedUcError = AccessDeniedError<
  'COURSE_ACCESS_DENIED',
  undefined
>;

/** Любая известная ошибка course-модуля */
export type CourseModuleError =
  | UserNotFoundUcError
  | CourseNotFoundUcError
  | CourseAccessDeniedUcError;
