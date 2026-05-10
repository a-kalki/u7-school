import type { DomainError } from "@u7/core/domain";

/** Ошибка нарушения инвариантов Lesson */
export type LessonArError = DomainError<
  "LESSON_INVARIANT",
  "domain",
  undefined
>;
