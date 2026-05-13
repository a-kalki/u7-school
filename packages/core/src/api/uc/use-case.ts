import * as v from "valibot";
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
	/** Уникальное имя use-case (например "create-course") */
	ucName: string;
	/** Метаданные агрегата, к которому привязан use-case */
	arMeta: { name: string; label: string };
	input: unknown;
	output: unknown;
	errors: AppError;
	/** Требуется ли авторизация для выполнения */
	requiresAuth: boolean;
	/** Тип use-case: команда или запрос */
	type: "command" | "query";
}

export interface UcDocType {
	ucName: UcMeta["ucName"];
	ucLabel: string;
	arName: string;
	arLabel: string;
	type: UseCaseType;
	requiresAuth: UcMeta["requiresAuth"];
	inputSchema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
	outputSchema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
}

export abstract class UseCase<TMeta extends UcMeta, TResolve = unknown> {
	/** Уникальное имя use-case (например "create-course") */
	protected abstract readonly ucName: TMeta["ucName"];

	/** Человекочитаемая метка use-case */
	protected abstract readonly ucLabel: string;

	/** Метаданные агрегата: имя и метка */
	protected abstract readonly arMeta: {
		arName: TMeta["arMeta"]["name"];
		arLabel: TMeta["arMeta"]["label"];
	};

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

	getUcName(): TMeta["ucName"] {
		return this.ucName;
	}

	/**
	 * Возвращает метаданные use-case вместе со схемами.
	 */
	getDocType(): UcDocType {
		return {
			ucName: this.ucName,
			ucLabel: this.ucLabel,
			arName: this.arMeta.arName,
			arLabel: this.arMeta.arLabel,
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
	protected abstract getUser(userId: string): Promise<unknown>;

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
				const issues = v.flatten(error.issues);
				const mapped = issues.nested
					? Object.entries(issues.nested).map(([path, msgs]) => ({
							path,
							message: (msgs as string[]).join("; "),
						}))
					: [];

				this.throwBaseErrors(
					errValidation<InputValidationError>(
						"INPUT_VALIDATION_ERROR",
						"Переданы некорректные данные",
						{
							issues: mapped,
							rawIssues: error.issues as v.BaseIssue<unknown>[],
						},
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
				const issues = v.flatten(error.issues);
				const mapped = issues.nested
					? Object.entries(issues.nested).map(([path, msgs]) => ({
							path,
							message: (msgs as string[]).join("; "),
						}))
					: [];

				this.throwBaseErrors(
					errInternal<OutputValidationError>(
						"OUTPUT_VALIDATION_ERROR",
						"Ошибка валидации выходных данных",
						{ issues: mapped },
						"domain",
					),
				);
			}
			throw error;
		}
	}
}
