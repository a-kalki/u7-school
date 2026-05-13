import type {
	AccessDeniedError,
	AppError,
	BadRequestError,
	ConflictError,
	DomainError,
	InternalError,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "./errors";
import { AppException } from "./errors";

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

// ── Фабрики ошибок ──

export function errNotFound<E extends NotFoundError>(
	name: E["name"],
	message: E["message"],
	payload: E["payload"],
): E {
	return { name, level: "domain", kind: "not-found", message, payload } as E;
}

export function errConflict<E extends ConflictError>(
	name: E["name"],
	message: E["message"],
	payload: E["payload"],
): E {
	return { name, level: "domain", kind: "conflict", message, payload } as E;
}

export function errAccessDenied<E extends AccessDeniedError>(
	name: E["name"],
	message: E["message"],
	payload: E["payload"],
): E {
	return {
		name,
		level: "domain",
		kind: "access-denied",
		message,
		payload,
	} as E;
}

export function errBadRequest<E extends BadRequestError>(
	name: E["name"],
	message: E["message"],
	payload: E["payload"],
): E {
	return { name, level: "api", kind: "bad-request", message, payload } as E;
}

export function errUnauthorized<E extends UnauthorizedError>(
	name: E["name"],
	message: E["message"],
): E {
	return { name, level: "api", kind: "unauthorized", message } as E;
}

export function errValidation<E extends ValidationError>(
	name: E["name"],
	message: E["message"],
	payload: E["payload"],
): E {
	return { name, level: "domain", kind: "validation", message, payload } as E;
}

export function errInternal<
	E extends InternalError<string, unknown, "domain" | "api">,
>(
	name: E["name"],
	message: E["message"],
	payload: E["payload"],
	level?: E["level"],
): E {
	return {
		name,
		level: (level ?? "api") as E["level"],
		kind: "internal",
		message,
		payload,
	} as E;
}

/** Фабрика доменной ошибки агрегата */
export function errDomain<E extends DomainError>(
	name: E["name"],
	message: E["message"],
	aggregateName: E["aggregateName"],
	payload?: E["payload"],
): E {
	return {
		name,
		level: "domain",
		kind: "internal",
		message,
		aggregateName,
		payload: payload as E["payload"],
	} as E;
}
