import * as v from "valibot";
import { throwError } from "../errors/error-helpers";
import type { DomainError } from "../errors/errors";

export interface ArMeta {
  name: string;
  label: string;
  errors: DomainError;
  state: Record<string, unknown>;
}

export abstract class Aggregate<TMeta extends ArMeta> {
  /** Valibot-схема для валидации состояния агрегата */
  readonly schema: v.GenericSchema<TMeta["state"]>;

  #state: TMeta["state"];

  constructor(state: TMeta["state"], schema: v.GenericSchema<TMeta["state"]>) {
    const result = v.safeParse(schema, state);
    if (!result.success) {
      this.throwInvariant(
        { issues: v.flatten(result.issues) },
        "Нарушены инварианты агрегата",
      );
    }
    this.#state = result.output;
    this.schema = schema;
  }

  /** Состояние агрегата только для чтения */
  get state(): Readonly<TMeta["state"]> {
    return structuredClone(this.#state);
  }

  protected checkInvariant(): void { }

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
