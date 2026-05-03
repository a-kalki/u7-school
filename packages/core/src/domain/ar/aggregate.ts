import { throwError } from "../errors/error-helpers";
import type { AppError, DomainError } from "../errors/errors";

export interface ArMeta {
  name: string;
  errors: DomainError;
}

export abstract class Aggregate<TMeta extends ArMeta> {
  /** Ошибка инварианта. */
  protected throwInvariant<
    K extends Extract<TMeta["errors"], { kind: "validation" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(
    name: K,
    message = "Нарушение инварианта домена",
    payload?: E["payload"],
  ): never {
    throwError({
      name,
      level: "domain",
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
    message = "Конфликт состояния домена",
    payload?: E["payload"],
  ): never {
    throwError({
      name,
      level: "domain",
      kind: "conflict",
      message,
      payload,
    } as AppError);
  }
}
