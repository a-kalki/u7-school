export type ErrorKind =
	| "validation"
	| "conflict"
	| "not-found"
	| "access-denied"
	| "bad-request"
	| "internal";

export interface AppError {
	name: string;
	level: "domain" | "api";
	kind: ErrorKind;
	userMessage: string;
	debugInfo: string;
	payload?: unknown;
}

export interface DomainError extends AppError {
  level: "domain";
}

export interface ApiError extends AppError {
  level: "api";
}

export class AppException extends Error {
  constructor(public readonly error: AppError) {
    super(error.userMessage);
    this.name = "AppException";
  }
}
