// Domain слой @u7/core
export type { ArMeta } from "./ar/aggregate";
export { Aggregate } from "./ar/aggregate";
export type { FileMetadata } from "./common/file-metadata";
// Общие value-objects
export { FileMetadataSchema } from "./common/file-metadata";
export {
	errAccessDenied,
	errBadRequest,
	errConflict,
	errDomain,
	errInternal,
	errNotFound,
	errUnauthorized,
	errValidation,
	fromError,
	throwError,
} from "./errors/error-helpers";
export type {
	AccessDeniedError,
	AppError,
	AuthError,
	BadRequestError,
	BaseUcErrors,
	ConflictError,
	DomainError,
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
export type { ApiModuleMeta, AppMeta, ModuleCommand } from "./module/types";
