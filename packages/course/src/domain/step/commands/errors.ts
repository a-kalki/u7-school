import type { AccessDeniedError, NotFoundError } from "@u7/core/domain";

/** Шаг не найден */
export type StepNotFoundUcError = NotFoundError<
  "STEP_NOT_FOUND",
  { uuid?: string } | undefined
>;

/** Доступ запрещён */
export type StepAccessDeniedUcError = AccessDeniedError<
  "STEP_ACCESS_DENIED",
  undefined
>;

/** Любая известная ошибка step-модуля */
export type StepModuleError =
  | StepNotFoundUcError
  | StepAccessDeniedUcError;
