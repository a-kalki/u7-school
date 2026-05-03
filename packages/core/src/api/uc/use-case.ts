import { throwError } from "../../domain/errors/error-helpers";
import type { AppError } from "../../domain/errors/errors";

export interface UcMeta {
  commandName: string;
  input: unknown;
  output: unknown;
  errors: AppError;
}

export abstract class UseCase<TMeta extends UcMeta, TResolve = unknown> {
  abstract execute(
    command: TMeta["input"],
    actorId?: string,
  ): Promise<TMeta["output"]> | TMeta["output"];

  /** Данные не найдены */
  protected throwNotFound<
    K extends Extract<TMeta["errors"], { kind: "not-found" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(
    name: K,
    message = "Сущность не найдена",
    payload?: E["payload"],
    level: E["level"] = "domain",
  ): never {
    throwError({
      name,
      level,
      kind: "not-found",
      message,
      payload,
    } as AppError);
  }

  /** Нет прав на действие */
  protected throwAccessDenied<
    K extends Extract<TMeta["errors"], { kind: "access-denied" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(
    name: K,
    message = "Доступ запрещен",
    payload?: E["payload"],
    level: E["level"] = "domain",
  ): never {
    throwError({
      name,
      level,
      kind: "access-denied",
      message,
      payload,
    } as AppError);
  }

  /** Невозможно обработать */
  protected throwBadRequest<
    K extends Extract<TMeta["errors"], { kind: "bad-request" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(
    name: K,
    message = "Некорректный запрос",
    payload?: E["payload"],
    level = "api",
  ): never {
    throwError({
      name,
      level,
      kind: "bad-request",
      message,
      payload,
    } as AppError);
  }

  /** Ошибка валидации */
  protected throwValidation(
    payload: Record<string, unknown>,
    message = "Ошибка валидации",
    level = "domain",
  ): never {
    throwError({
      name: "ValidationError",
      level,
      kind: "validation",
      message,
      payload,
    } as AppError);
  }

  /** Ошибки доменных правил */
  protected throwConflict<
    K extends Extract<TMeta["errors"], { kind: "conflict" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(
    name: K,
    message = "Конфликт данных и текущего действия",
    payload?: E["payload"],
    level: E["level"] = "domain",
  ): never {
    throwError({
      name,
      level,
      kind: "conflict",
      message,
      payload,
    } as AppError);
  }

  /** Исключительные ошибки в коде */
  protected throwInternal<
    K extends Extract<TMeta["errors"], { kind: "internal" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(
    name: K,
    message = "Внутренняя ошибка сервера",
    payload?: E["payload"],
    level: E["level"] = "api",
  ): never {
    throwError({
      name,
      level,
      kind: "internal",
      message,
      payload,
    } as AppError);
  }
}
