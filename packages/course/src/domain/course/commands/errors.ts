import type { AccessDeniedError, NotFoundError } from '@u7-scl/core/domain';

/** Курс не найден */
export type CourseNotFoundUcError = NotFoundError<
  'COURSE_NOT_FOUND',
  { uuid?: string } | undefined
>;

/** Доступ к курсу запрещён */
export type CourseAccessDeniedUcError = AccessDeniedError<
  'COURSE_ACCESS_DENIED',
  undefined
>;
