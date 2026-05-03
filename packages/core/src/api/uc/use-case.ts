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

	/** Выбрасывает ошибку NotFound (404) */
	protected throwNotFound<
		K extends Extract<TMeta["errors"], { kind: "not-found" }>["name"],
		E extends Extract<TMeta["errors"], { name: K }>,
	>(
		name: K,
		userMessage = "Сущность не найдена",
		debugInfo = "Не удалось найти запрошенную сущность",
		payload?: E["payload"],
	): never {
		throwError({
			name,
			level: "api",
			kind: "not-found",
			userMessage,
			debugInfo,
			payload,
		} as AppError);
	}

	/** Выбрасывает ошибку AccessDenied (403) */
	protected throwAccessDenied<
		K extends Extract<TMeta["errors"], { kind: "access-denied" }>["name"],
		E extends Extract<TMeta["errors"], { name: K }>,
	>(
		name: K,
		userMessage = "Доступ запрещен",
		debugInfo = "Недостаточно прав для выполнения действия",
		payload?: E["payload"],
	): never {
		throwError({
			name,
			level: "api",
			kind: "access-denied",
			userMessage,
			debugInfo,
			payload,
		} as AppError);
	}

	/** Выбрасывает ошибку BadRequest (400) */
	protected throwBadRequest<
		K extends Extract<TMeta["errors"], { kind: "bad-request" }>["name"],
		E extends Extract<TMeta["errors"], { name: K }>,
	>(
		name: K,
		userMessage = "Некорректный запрос",
		debugInfo = "Переданы некорректные параметры запроса",
		payload?: E["payload"],
	): never {
		throwError({
			name,
			level: "api",
			kind: "bad-request",
			userMessage,
			debugInfo,
			payload,
		} as AppError);
	}

	/** Выбрасывает ошибку Validation (422) */
	protected throwValidation<
		K extends Extract<TMeta["errors"], { kind: "validation" }>["name"],
		E extends Extract<TMeta["errors"], { name: K }>,
	>(
		name: K,
		userMessage = "Ошибка валидации",
		debugInfo = "Введенные данные не прошли проверку",
		payload?: E["payload"],
	): never {
		throwError({
			name,
			level: "api",
			kind: "validation",
			userMessage,
			debugInfo,
			payload,
		} as AppError);
	}

	/** Выбрасывает ошибку Conflict (409) */
	protected throwConflict<
		K extends Extract<TMeta["errors"], { kind: "conflict" }>["name"],
		E extends Extract<TMeta["errors"], { name: K }>,
	>(
		name: K,
		userMessage = "Конфликт данных",
		debugInfo = "Действие конфликтует с текущим состоянием системы",
		payload?: E["payload"],
	): never {
		throwError({
			name,
			level: "api",
			kind: "conflict",
			userMessage,
			debugInfo,
			payload,
		} as AppError);
	}

	/** Выбрасывает внутреннюю ошибку (500) */
	protected throwInternal<
		K extends Extract<TMeta["errors"], { kind: "internal" }>["name"],
		E extends Extract<TMeta["errors"], { name: K }>,
	>(
		name: K,
		userMessage = "Внутренняя ошибка сервера",
		debugInfo = "Произошла непредвиденная ошибка",
		payload?: E["payload"],
	): never {
		throwError({
			name,
			level: "api",
			kind: "internal",
			userMessage,
			debugInfo,
			payload,
		} as AppError);
	}
}
