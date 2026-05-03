import { AppException } from "./errors";
import type { AppError } from "./errors";

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
		kind: "internal",
		userMessage: "Произошла неизвестная ошибка",
		debugInfo,
	};
}
