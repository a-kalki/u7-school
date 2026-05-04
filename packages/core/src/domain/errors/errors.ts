export type ErrorKind =
  | "validation"
  | "conflict"
  | "not-found"
  | "access-denied"
  | "unauthorized"
  | "bad-request"
  | "internal";

export interface AppError {
  name: string;
  level: "domain" | "api";
  kind: ErrorKind;
  message: string;
  payload?: unknown;
}

export type DomainErrorKinds = Extract<
  ErrorKind,
  | "validation" // ошибки валидации входящих данных
  | "conflict" // ошибки правил доменного слоя
  | "not-found" // в БД не найдена сущность
  | "access-denied" // нет прав на действие по политикам домена
  | "internal" // ошибка инвариантов агрегата или другая критическая ошибка
>;

export interface DomainError extends AppError {
  level: "domain";
  kind: DomainErrorKinds;
}

export interface CommandValidationError extends DomainError {
  name: "COMMAND_VALIDATION_ERROR";
}

export type ApiErrorKinds = Extract<
  ErrorKind,
  | "unauthorized" // только для авторизованных
  | "bad-request" // запрос который невозможно обработать
  | "internal" // критическая ошибка
>;

export interface ApiError extends AppError {
  level: "api";
  kind: ApiErrorKinds;
}

export interface UnauthorizedError extends ApiError {
  name: "UNAUTHORIZED_ERROR";
}

export interface NoCommandFoundError extends ApiError {
  name: "NO_COMMAND_FOUND";
  payload: {
    commandName: string;
    moduleName: string;
  };
}

export interface ServerInternalError extends ApiError {
  name: "SEVER_INTERNAL_ERROR";
}

/** Ошибки которые могут вернуться с любого запроса */
export type BaseUcErrors =
  | CommandValidationError
  | NoCommandFoundError
  | ServerInternalError;

export class AppException extends Error {
  constructor(public readonly error: AppError) {
    super(error.message);
    this.name = "AppException";
  }
}
