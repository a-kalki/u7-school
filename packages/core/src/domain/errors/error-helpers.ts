import { AppException } from "./errors";
import type { AppError } from "./errors";

export function throwError(error: AppError): never {
	throw new AppException(error);
}

export function fromError(error: unknown): AppError {
	if (error instanceof AppException) {
		return error.error;
	}

	let message = "Unknown error";
	if (error instanceof Error) {
		message = error.message;
	} else if (typeof error === "string") {
		message = error;
	} else {
		message = String(error);
	}

	return {
		name: "UnknownError",
		level: "api",
		kind: "internal",
		message,
	};
}
