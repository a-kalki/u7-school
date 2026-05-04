import * as v from "valibot";
import type { ArMeta } from "../../domain/ar/aggregate";
import { throwError } from "../../domain/errors/error-helpers";
import type {
  AppError,
  DomainError,
  InputValidationError,
  OutputValidationError,
  UnAuthorizedError,
} from "../../domain/errors/errors";

type UseCaseType = "command" | "query";

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

export interface UcDocType {
  commandName: UcMeta["commandName"];
  description: UcMeta["description"];
  aggregateName: ArMeta["name"];
  aggregateLabel: ArMeta["label"];
  type: UseCaseType;
  requiresAuth: UcMeta["requiresAuth"];
  inputSchema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
  outputSchema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
}

export abstract class UseCase<TMeta extends UcMeta, TResolve = unknown> {
  /** Имя команды, которую обрабатывает этот use-case */
  protected abstract readonly commandName: TMeta["commandName"];

  /** User-friendly описание use-case */
  protected abstract readonly description: TMeta["description"];

  /** Техническое имя агрегата */
  protected abstract readonly aggregateName: TMeta["arMeta"]["name"];

  /** User-friendly название агрегата */
  protected abstract readonly aggregateLabel: TMeta["arMeta"]["label"];

  /** Тип use-case: команда или запрос */
  protected abstract readonly type: TMeta["type"];

  /** Требуется ли авторизация для выполнения */
  protected abstract readonly requiresAuth: TMeta["requiresAuth"];

  /** Схема Valibot для валидации входящих данных */
  protected abstract readonly inputSchema: v.BaseSchema<
    unknown,
    TMeta["input"],
    v.BaseIssue<unknown>
  >;

  /** Схема Valibot для валидации выходных данных */
  protected abstract readonly outputSchema: v.BaseSchema<
    unknown,
    TMeta["output"],
    v.BaseIssue<unknown>
  >;

  protected resolve!: TResolve;

  /**
   * Инициализирует use-case с резолвером.
   * Вызывается модулем при регистрации use-case.
   */
  init(resolve: TResolve) {
    this.resolve = resolve;
  }

  getCommandName(): TMeta["commandName"] {
    return this.commandName;
  }

  /**
   * Возвращает метаданные команды вместе со схемами.
   */
  getDocType(): UcDocType {
    return {
      commandName: this.commandName,
      description: this.description,
      aggregateName: this.aggregateName,
      aggregateLabel: this.aggregateLabel,
      type: this.type,
      requiresAuth: this.requiresAuth,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
    };
  }

  /**
   * Основной метод выполнения use-case.
   * @param command Входящие данные (невалидированные)
   * @param actorId ID пользователя, выполняющего действие (опционально)
   */
  async handle(command: unknown, actorId?: string): Promise<TMeta["output"]> {
    this.checkAuth(actorId);
    const validatedCommand = this.validateInput(command);
    const result = await this.execute(
      validatedCommand,
      actorId as TMeta["requiresAuth"] extends true
      ? string
      : string | undefined,
    );
    return this.validateOutput(result);
  }

  /** Бизнес-логика use-case */
  protected abstract execute(
    command: TMeta["input"],
    actorId: TMeta["requiresAuth"] extends true ? string : string | undefined,
  ): Promise<TMeta["output"]> | TMeta["output"];

  /**
   * Проверяет авторизацию. Можно переопределить для кастомной логики.
   */
  protected checkAuth(actorId?: string): void {
    if (this.requiresAuth && actorId === undefined) {
      throwError({
        name: "UNAUTHORIZED_ERROR",
        level: "api",
        kind: "unauthorized",
        message: "Требуется авторизация",
      } satisfies UnAuthorizedError);
    }
  }

  /**
   * Валидирует входящие данные через inputSchema.
   * В случае ошибки выбрасывает Validation AppError.
   */
  protected validateInput(command: unknown): TMeta["input"] {
    try {
      return v.parse(this.inputSchema, command);
    } catch (error) {
      if (error instanceof v.ValiError) {
        const issues = error.issues.map((issue) => ({
          // biome-ignore lint/suspicious/noExplicitAny: reason
          path: issue.path?.map((p: any) => p.key).join("."),
          message: issue.message,
        }));

        const name: InputValidationError["name"] = "INPUT_VALIDATION_ERROR";
        this.throwValidation({ issues }, name, "Переданы некорректные данные");
      }
      throw error;
    }
  }

  /**
   * Валидирует выходные данные через outputSchema.
   * В случае ошибки выбрасывает internal AppError.
   */
  protected validateOutput(result: unknown): TMeta["output"] {
    try {
      return v.parse(this.outputSchema, result);
    } catch (error) {
      if (error instanceof v.ValiError) {
        const issues = error.issues.map((issue) => ({
          // biome-ignore lint/suspicious/noExplicitAny: reason
          path: issue.path?.map((p: any) => p.key).join("."),
          message: issue.message,
        }));

        this.throwInternal(
          "OUTPUT_VALIDATION_ERROR",
          "Ошибка валидации выходных данных",
          { issues },
        );
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
    K extends Extract<
      TMeta["errors"] & OutputValidationError,
      { kind: "internal" }
    >["name"],
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
