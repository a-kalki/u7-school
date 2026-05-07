import * as v from "valibot";
import type { ArMeta } from "#domain/ar/aggregate";
import {
  errInternal,
  errUnauthorized,
  errValidation,
  throwError,
} from "#domain/errors/error-helpers";
import type {
  AppError,
  AuthError,
  BaseUcErrors,
  InputValidationError,
  OutputValidationError,
} from "#domain/errors/errors";

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
  arName: ArMeta["name"];
  arLabel: ArMeta["label"];
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
  protected abstract readonly arName: TMeta["arMeta"]["name"];

  /** User-friendly название агрегата */
  protected abstract readonly arLabel: TMeta["arMeta"]["label"];

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
      arName: this.arName,
      arLabel: this.arLabel,
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
   * Получает актора (пользователя), выполняющего действие.
   */
  protected abstract getUser(userId: string): Promise<TMeta["arMeta"]["state"]>;

  /**
   * Проверяет права доступа актора на выполнение команды.
   * Должна выбросить ошибку доступа, если прав недостаточно.
   */
  protected abstract checkPolicy(
    command: TMeta["input"],
    actor: TMeta["arMeta"]["state"],
  ): Promise<void> | void;

  /**
   * Единый метод для выбрасывания ошибок.
   * Принимает только ошибки, объявленные в UcMeta.errors | BaseUcErrors.
   * Система типов блокирует передачу ошибок, не входящих в union.
   */
  protected throwError(error: TMeta["errors"]): never {
    throwError(error);
  }

  protected throwBaseErrors(error: BaseUcErrors): never {
    throwError(error);
  }

  /**
   * Проверяет авторизацию. Можно переопределить для кастомной логики.
   */
  protected checkAuth(actorId?: string): void {
    if (this.requiresAuth && actorId === undefined) {
      this.throwBaseErrors(
        errUnauthorized<AuthError>(
          "UNAUTHORIZED_ERROR",
          "Требуется авторизация",
        ),
      );
    }
  }

  /**
   * Валидирует входящие данные через inputSchema.
   * В случае ошибки выбрасывает INPUT_VALIDATION_ERROR.
   */
  protected validateInput(command: unknown): TMeta["input"] {
    try {
      return v.parse(this.inputSchema, command);
    } catch (error) {
      if (error instanceof v.ValiError) {
        const issues = error.issues.map((issue) => ({
          // biome-ignore lint/suspicious/noExplicitAny: путь Valibot может содержать любые ключи
          path: issue.path?.map((p: any) => p.key).join("."),
          message: issue.message,
        }));

        this.throwBaseErrors(
          errValidation<InputValidationError>(
            "INPUT_VALIDATION_ERROR",
            "Переданы некорректные данные",
            { issues, rawIssues: error.issues as v.BaseIssue<unknown>[] },
          ),
        );
      }
      throw error;
    }
  }

  /**
   * Валидирует выходные данные через outputSchema.
   * В случае ошибки выбрасывает OUTPUT_VALIDATION_ERROR.
   */
  protected validateOutput(result: unknown): TMeta["output"] {
    try {
      return v.parse(this.outputSchema, result);
    } catch (error) {
      if (error instanceof v.ValiError) {
        const issues = error.issues.map((issue) => ({
          // biome-ignore lint/suspicious/noExplicitAny: путь Valibot может содержать любые ключи
          path: issue.path?.map((p: any) => p.key).join("."),
          message: issue.message,
        }));

        this.throwBaseErrors(
          errInternal<OutputValidationError>(
            "OUTPUT_VALIDATION_ERROR",
            "Ошибка валидации выходных данных",
            { issues },
            "domain",
          ),
        );
      }
      throw error;
    }
  }
}
