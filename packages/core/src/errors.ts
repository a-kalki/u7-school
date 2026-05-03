export interface AppError {
	name: string;
	level: "domain" | "api";
	userMessage: string;
	debugInfo: string;
	payload?: unknown;
}

export interface DomainErrorObject extends AppError {
	level: "domain";
}

export interface ApiErrorObject extends AppError {
	level: "api";
}

export class AppException extends Error {
	constructor(public readonly error: AppError) {
		super(error.userMessage);
		this.name = "AppException";
	}
}

export function throwError(error: AppError): never {
	throw new AppException(error);
}

export function fromError(error: unknown): AppError {
	if (error instanceof AppException) {
		return error.error;
	}

	let debugInfo = "Unknown error";
	if (error instanceof Error) {
		debugInfo = error.message;
	} else if (typeof error === "string") {
		debugInfo = error;
	} else {
		debugInfo = String(error);
	}

	return {
		name: "UnknownError",
		level: "api",
		userMessage: "Произошла неизвестная ошибка",
		debugInfo,
	};
}
