import type { ApiError, DomainError } from "./errors";
import { AppException } from "./errors";

export function throwError(error: DomainError | ApiError): never {
  throw new AppException(error);
}

export function fromError(error: unknown): DomainError | ApiError {
  if (error instanceof AppException) {
    return error.error as DomainError | ApiError;
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
