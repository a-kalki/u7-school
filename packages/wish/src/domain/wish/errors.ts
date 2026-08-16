import type { ConflictError, NotFoundError } from '@u7-scl/core/domain';

/** Курс не найден. */
export type CourseNotFoundUcError = NotFoundError<
  'COURSE_NOT_FOUND',
  { courseId: string } | undefined
>;

/** Желание уже выражено для этого курса. */
export type WishAlreadyExistsUcError = ConflictError<
  'WISH_ALREADY_EXISTS',
  { userId: string; courseId: string } | undefined
>;

/** Желание не найдено. */
export type WishNotFoundUcError = NotFoundError<
  'WISH_NOT_FOUND',
  { userId: string; courseId: string } | undefined
>;

/** Любая известная ошибка модуля wish. */
export type WishModuleError =
  | CourseNotFoundUcError
  | WishAlreadyExistsUcError
  | WishNotFoundUcError;
