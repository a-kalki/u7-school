// Domain слой @u7/core
export type { ArMeta } from "./ar/aggregate";
export { Aggregate } from "./ar/aggregate";
export type {
  AccessDeniedError,
  AppError,
  AuthError,
  BadRequestError,
  BaseUcErrors,
  ConflictError,
  ErrorKind,
  InputValidationError,
  InternalError,
  NoCommandFoundError,
  NotFoundError,
  OutputValidationError,
  ServerInternalError,
  UnauthorizedError,
  ValidationError,
  ValidationIssues,
} from "./errors/errors";
export { AppException } from "./errors/errors";
export {
  errAccessDenied,
  errBadRequest,
  errConflict,
  errInternal,
  errNotFound,
  errUnauthorized,
  errValidation,
  fromError,
  throwError,
} from "./errors/error-helpers";
export type { ModuleCommand, ModuleMeta } from "./module/types";
