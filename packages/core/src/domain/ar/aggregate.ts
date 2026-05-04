import { throwError } from "../errors/error-helpers";
import type { DomainError } from "../errors/errors";

export interface ArMeta {
  name: string;
  label: string;
  errors: DomainError;
}

export abstract class Aggregate<TMeta extends ArMeta> {
  /** Ошибка инварианта. */
  protected throwInvariant(
    payload: Record<string, unknown>,
    message = "Нарушены инварианты агрегата",
  ): never {
    throwError({
      name: "AR_INVARIANT_ERROR",
      level: "domain",
      kind: "internal",
      message,
      payload,
    } satisfies DomainError);
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
    } satisfies DomainError);
  }
}
