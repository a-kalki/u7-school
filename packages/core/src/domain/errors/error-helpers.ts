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

// ── Дженерик-типы для результатов фабрик ──

/** Ошибка с kind="not-found" (domain) */
export type NotFoundError<
  N extends string = string,
  P = undefined,
> = P extends undefined
  ? {
    name: N;
    level: "domain";
    kind: "not-found";
    message: string;
    payload?: undefined;
  }
  : {
    name: N;
    level: "domain";
    kind: "not-found";
    message: string;
    payload: P;
  };

/** Ошибка с kind="conflict" (domain) */
export type ConflictError<
  N extends string = string,
  P = undefined,
> = P extends undefined
  ? {
    name: N;
    level: "domain";
    kind: "conflict";
    message: string;
    payload?: undefined;
  }
  : { name: N; level: "domain"; kind: "conflict"; message: string; payload: P };

/** Ошибка с kind="access-denied" (domain) */
export type AccessDeniedError<
  N extends string = string,
  P = undefined,
> = P extends undefined
  ? {
    name: N;
    level: "domain";
    kind: "access-denied";
    message: string;
    payload?: undefined;
  }
  : {
    name: N;
    level: "domain";
    kind: "access-denied";
    message: string;
    payload: P;
  };

/** Ошибка с kind="bad-request" (api) */
export type BadRequestError<
  N extends string = string,
  P = undefined,
> = P extends undefined
  ? {
    name: N;
    level: "api";
    kind: "bad-request";
    message: string;
    payload?: undefined;
  }
  : { name: N; level: "api"; kind: "bad-request"; message: string; payload: P };

/** Ошибка с kind="validation" (domain) */
export type ValidationError<
  N extends string = string,
  P = undefined,
> = P extends undefined
  ? {
    name: N;
    level: "domain";
    kind: "validation";
    message: string;
    payload?: undefined;
  }
  : {
    name: N;
    level: "domain";
    kind: "validation";
    message: string;
    payload: P;
  };

/** Ошибка с kind="internal" (api/domain) */
export type InternalError<
  N extends string = string,
  P = undefined,
  L extends "domain" | "api" = "api",
> = P extends undefined
  ? {
    name: N;
    level: L;
    kind: "internal";
    message: string;
    payload?: undefined;
  }
  : { name: N; level: L; kind: "internal"; message: string; payload: P };

// ── Фабрики ошибок ──

/** Создаёт доменную ошибку «не найдено» */
export function errNotFound<N extends string, P = undefined>(
  name: N,
  message: string,
  payload?: P,
): NotFoundError<N, P> {
  return {
    name,
    level: "domain",
    kind: "not-found",
    message,
    payload: payload as P,
  } as NotFoundError<N, P>;
}

/** Создаёт доменную ошибку «конфликт» */
export function errConflict<N extends string, P = undefined>(
  name: N,
  message: string,
  payload?: P,
): ConflictError<N, P> {
  return {
    name,
    level: "domain",
    kind: "conflict",
    message,
    payload: payload as P,
  } as ConflictError<N, P>;
}

/** Создаёт доменную ошибку «доступ запрещён» */
export function errAccessDenied<N extends string, P = undefined>(
  name: N,
  message: string,
  payload?: P,
): AccessDeniedError<N, P> {
  return {
    name,
    level: "domain",
    kind: "access-denied",
    message,
    payload: payload as P,
  } as AccessDeniedError<N, P>;
}

/** Создаёт API-ошибку «некорректный запрос» */
export function errBadRequest<N extends string, P = undefined>(
  name: N,
  message: string,
  payload?: P,
): BadRequestError<N, P> {
  return {
    name,
    level: "api",
    kind: "bad-request",
    message,
    payload: payload as P,
  } as BadRequestError<N, P>;
}

/** Создаёт доменную ошибку валидации */
export function errValidation<N extends string, P = undefined>(
  name: N,
  message: string,
  payload?: P,
): ValidationError<N, P> {
  return {
    name,
    level: "domain",
    kind: "validation",
    message,
    payload: payload as P,
  } as ValidationError<N, P>;
}

/** Создаёт внутреннюю ошибку (api по умолчанию) */
export function errInternal<
  N extends string,
  P = undefined,
  L extends "domain" | "api" = "api",
>(name: N, message: string, payload?: P, level?: L): InternalError<N, P, L> {
  return {
    name,
    level: (level ?? "api") as L,
    kind: "internal",
    message,
    payload: payload as P,
  } as InternalError<N, P, L>;
}
