import type { AccessDeniedError, NotFoundError } from "@u7/core/domain";

/** Урок не найден */
export type LessonNotFoundUcError = NotFoundError<
  "LESSON_NOT_FOUND",
  { uuid?: string } | undefined
>;

/** Доступ запрещён */
export type LessonAccessDeniedUcError = AccessDeniedError<
  "LESSON_ACCESS_DENIED",
  undefined
>;

/** Любая известная ошибка lesson-модуля */
export type LessonModuleError =
  | LessonNotFoundUcError
  | LessonAccessDeniedUcError;
