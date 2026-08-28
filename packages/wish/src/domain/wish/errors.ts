import type { ConflictError, NotFoundError } from '@u7-scl/core/domain';
import type { WishStatus } from './entity';

/** Курс не найден. */
export type CourseNotFoundUcError = NotFoundError<
  'COURSE_NOT_FOUND',
  { courseId: string } | undefined
>;

/** Желание уже выражено для этой цели (курс или модуль). */
export type WishAlreadyExistsUcError = ConflictError<
  'WISH_ALREADY_EXISTS',
  | {
      userId: string;
      courseId?: string;
      moduleId?: string;
      /** Статус существующего активного желания — для ветвления UI (W04). */
      status: WishStatus;
    }
  | undefined
>;

/** Желание не найдено. */
export type WishNotFoundUcError = NotFoundError<
  'WISH_NOT_FOUND',
  { userId: string; courseId: string } | undefined
>;

/** Модуль не найден (или его курс недоступен для записи). */
export type ModuleNotFoundUcError = NotFoundError<
  'MODULE_NOT_FOUND',
  { moduleId: string } | undefined
>;

/** Любая известная ошибка модуля wish. */
export type WishModuleError =
  | CourseNotFoundUcError
  | ModuleNotFoundUcError
  | WishAlreadyExistsUcError
  | WishNotFoundUcError;
