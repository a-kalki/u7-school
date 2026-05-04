import * as v from "valibot";
import { throwError } from "../../domain/errors/error-helpers";
import type { ArMeta } from "../../domain/ar/aggregate";
import type {
  AppError,
  CommandValidationError,
  DomainError,
} from "../../domain/errors/errors";

export interface UcMeta {
  commandName: string;
  /** User-friendly описание use-case ("Добавить нового пользователя") */
  description: string;
  /** Метаданные агрегата, к которому привязан use-case */
  arMeta: ArMeta;
  input: unknown;
  output: unknown;
  errors: AppError;
  /** Требуется ли авторизация для выполнения */
  requiresAuth: boolean;
  /** Тип use-case: команда или запрос */
  type: "command" | "query";
}

export abstract class UseCase<TMeta extends UcMeta, TResolve = unknown> {
  /** Имя команды, которую обрабатывает этот use-case */
  abstract readonly commandName: TMeta["commandName"];

  /** Схема Valibot для валидации входящих данных */
  protected abstract readonly inputSchema: v.BaseSchema<
    unknown,
    TMeta["input"],
    v.BaseIssue<unknown>
  >;

  getInputSchema(): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
    return this.inputSchema;
  }

  protected resolve!: TResolve;

  /**
   * Инициализирует use-case с резолвером.
   * Вызывается модулем при регистрации use-case.
   */
  init(resolve: TResolve) {
    this.resolve = resolve;
  }

  /**
   * Основной метод выполнения use-case.
   * @param command Входящие данные (невалидированные)
   * @param actorId ID пользователя, выполняющего действие (опционально)
   */
  async handle(command: unknown, actorId?: string): Promise<TMeta["output"]> {
    const validatedCommand = this.validate(command);
    return this.execute(validatedCommand, actorId);
  }

  /** Бизнес-логика use-case */
  protected abstract execute(
    command: TMeta["input"],
    actorId?: string,
  ): Promise<TMeta["output"]> | TMeta["output"];

  /**
   * Валидирует входящие данные через inputSchema.
   * В случае ошибки выбрасывает Validation AppError.
   */
  protected validate(command: unknown): TMeta["input"] {
    try {
      return v.parse(this.inputSchema, command);
    } catch (error) {
      if (error instanceof v.ValiError) {
        const issues = error.issues.map((issue) => ({
          // biome-ignore lint/suspicious/noExplicitAny: reason
          path: issue.path?.map((p: any) => p.key).join("."),
          message: issue.message,
        }));

        const name: CommandValidationError["name"] = "COMMAND_VALIDATION_ERROR";
        this.throwValidation({ issues }, name, "Переданы некорректные данные");
      }
      throw error;
    }
  }

  /** Данные не найдены */
  protected throwNotFound<
    K extends Extract<TMeta["errors"], { kind: "not-found" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(name: K, message = "Сущность не найдена", payload?: E["payload"]): never {
    throwError({
      name,
      level: "domain",
      kind: "not-found",
      message,
      payload,
    });
  }

  /** Нет прав на действие */
  protected throwAccessDenied<
    K extends Extract<TMeta["errors"], { kind: "access-denied" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(name: K, message = "Доступ запрещен", payload?: E["payload"]): never {
    throwError({
      name,
      level: "domain",
      kind: "access-denied",
      message,
      payload,
    });
  }

  /** Невозможно обработать */
  protected throwBadRequest<
    K extends Extract<TMeta["errors"], { kind: "bad-request" }>["name"],
    E extends Extract<TMeta["errors"], { name: K }>,
  >(name: K, message = "Некорректный запрос", payload?: E["payload"]): never {
    throwError({
      name,
      level: "api",
      kind: "bad-request",
      message,
      payload,
    });
  }

  /** Ошибка валидации */
  protected throwValidation(
    payload: Record<string, unknown>,
    name: string,
    message: string,
  ): never {
    throwError({
      name,
      level: "domain",
      kind: "validation",
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
    message = "Конфликт данных и текущего действия",
    payload?: E["payload"],
  ): never {
    throwError({
      name,
      level: "domain",
      kind: "conflict",
      message,
      payload,
    });
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
    });
  }
}
