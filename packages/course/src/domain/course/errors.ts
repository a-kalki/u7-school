import type { DomainError } from "@u7/core/domain";

/** Ошибка нарушения инвариантов Course */
export type CourseArError = DomainError<
  "COURSE_INVARIANT",
  "domain",
  undefined
>;
