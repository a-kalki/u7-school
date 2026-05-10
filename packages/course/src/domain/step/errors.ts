import type { DomainError } from "@u7/core/domain";

/** Ошибка нарушения инвариантов Step */
export type StepArError = DomainError<
  "STEP_INVARIANT",
  "domain",
  undefined
>;
