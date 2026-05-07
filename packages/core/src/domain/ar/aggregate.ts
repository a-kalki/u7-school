import * as v from "valibot";
import { throwError } from "../errors/error-helpers";
import type { AppError } from "../errors/errors";

export interface ArMeta {
  name: string;
  label: string;
  state: Record<string, unknown>;
}

export abstract class Aggregate<TMeta extends ArMeta> {
  /** Valibot-схема для валидации состояния агрегата */
  readonly schema: v.GenericSchema<TMeta["state"]>;

  #state: TMeta["state"];

  constructor(state: TMeta["state"], schema: v.GenericSchema<TMeta["state"]>) {
    this.schema = schema;
    this.#state = this.validateState(state);
    this.checkInvariant();
  }

  /** Состояние агрегата только для чтения */
  get state(): Readonly<TMeta["state"]> {
    return structuredClone(this.#state);
  }

  /** Валидация состояния */
  protected validateState(state: TMeta["state"]): TMeta["state"] {
    const result = v.safeParse(this.schema, state);
    if (!result.success) {
      this.throwInvariant(
        { issues: v.flatten(result.issues) },
        "Нарушены инварианты агрегата",
      );
    }
    return result.output;
  }

  /** Проверка инвариантов (переопределяется в наследниках) */
  protected checkInvariant(): void {
    // По умолчанию ничего не проверяем
  }

  /** Обновление состояния с валидацией */
  protected updateState(newState: TMeta["state"]): void {
    this.#state = this.validateState(newState);
    this.checkInvariant();
  }

  /** Ошибка инварианта */
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
    } satisfies AppError);
  }
}
