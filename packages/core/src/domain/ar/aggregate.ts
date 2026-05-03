import { throwError } from "../errors/error-helpers";
import type { AppError, DomainError } from "../errors/errors";

export interface ArMeta {
  name: string;
  errors: DomainError;
}

export abstract class Aggregate<TMeta extends ArMeta> {
  /** Ошибка инварианта. */
  protected throwInvariant(
    payload: Record<string, unknown>,
    message = "Нарушение инварианта домена",
  ): never {
    throwError({
      name: "AggregateInvariantError",
      level: "api",
      kind: "internal",
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
