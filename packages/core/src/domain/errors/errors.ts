/** Категория ошибки */
export type ErrorKind =
	| "validation"
	| "conflict"
	| "not-found"
	| "access-denied"
	| "unauthorized"
	| "bad-request"
	| "internal";

/** Базовый интерфейс ошибки приложения */
export interface AppError {
	name: string;
	level: "domain" | "api";
	kind: ErrorKind;
	message: string;
	payload?: unknown;
}

// ── Вспомогательные типы ──

/** Структура ошибок валидации Valibot */
export type ValidationIssues = {
	issues: Array<{ path?: string; message: string }>;
};

// ── Дженерик-типы ошибок ──

/** Ошибка с kind="not-found" (domain) */
export type NotFoundError<
	N extends string = string,
	P = undefined,
> = P extends undefined
	? { name: N; level: "domain"; kind: "not-found"; message: string; payload?: undefined }
	: { name: N; level: "domain"; kind: "not-found"; message: string; payload: P };

/** Ошибка с kind="conflict" (domain) */
export type ConflictError<
	N extends string = string,
	P = undefined,
> = P extends undefined
	? { name: N; level: "domain"; kind: "conflict"; message: string; payload?: undefined }
	: { name: N; level: "domain"; kind: "conflict"; message: string; payload: P };

/** Ошибка с kind="access-denied" (domain) */
export type AccessDeniedError<
	N extends string = string,
	P = undefined,
> = P extends undefined
	? { name: N; level: "domain"; kind: "access-denied"; message: string; payload?: undefined }
	: { name: N; level: "domain"; kind: "access-denied"; message: string; payload: P };

/** Ошибка с kind="bad-request" (api) */
export type BadRequestError<
	N extends string = string,
	P = undefined,
> = P extends undefined
	? { name: N; level: "api"; kind: "bad-request"; message: string; payload?: undefined }
	: { name: N; level: "api"; kind: "bad-request"; message: string; payload: P };

/** Ошибка с kind="unauthorized" (api) */
export type UnauthorizedError<
	N extends string = string,
	P = undefined,
> = P extends undefined
	? { name: N; level: "api"; kind: "unauthorized"; message: string; payload?: undefined }
	: { name: N; level: "api"; kind: "unauthorized"; message: string; payload: P };

/** Ошибка с kind="validation" (domain) */
export type ValidationError<
	N extends string = string,
	P = undefined,
> = P extends undefined
	? { name: N; level: "domain"; kind: "validation"; message: string; payload?: undefined }
	: { name: N; level: "domain"; kind: "validation"; message: string; payload: P };

/** Ошибка с kind="internal" (domain или api) */
export type InternalError<
	N extends string = string,
	P = undefined,
	L extends "domain" | "api" = "api",
> = P extends undefined
	? { name: N; level: L; kind: "internal"; message: string; payload?: undefined }
	: { name: N; level: L; kind: "internal"; message: string; payload: P };

// ── Конкретные базовые ошибки фреймворка ──

export type InputValidationError = ValidationError<"INPUT_VALIDATION_ERROR", ValidationIssues>;
export type OutputValidationError = InternalError<"OUTPUT_VALIDATION_ERROR", ValidationIssues>;
export type AuthError = UnauthorizedError<"UNAUTHORIZED_ERROR">;
export type NoCommandFoundError = BadRequestError<"NO_COMMAND_FOUND", { commandName: string; moduleName: string }>;
export type ServerInternalError = InternalError<"SEVER_INTERNAL_ERROR">;

/** Ошибки, которые могут вернуться с любого запроса */
export type BaseUcErrors =
	| InputValidationError
	| AuthError
	| OutputValidationError
	| NoCommandFoundError
	| ServerInternalError;

// ── Исключение ──

export class AppException extends Error {
	constructor(public readonly error: AppError) {
		super(error.message);
		this.name = "AppException";
	}
}
