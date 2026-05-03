import { throwError } from "../errors/error-helpers";
import type { AppError, DomainError } from "../errors/errors";

export interface ArMeta {
	name: string;
	errors: DomainError;
}

export abstract class Aggregate<TMeta extends ArMeta> {
	/**
	 * Выбрасывает доменную ошибку нарушения инварианта (validation, 422).
	 */
	protected throwInvariant<
		K extends Extract<TMeta["errors"], { kind: "validation" }>["name"],
		E extends Extract<TMeta["errors"], { name: K }>,
	>(
		name: K,
		userMessage = "Нарушение инварианта домена",
		debugInfo = "Данные не соответствуют доменным правилам",
		payload?: E["payload"],
	): never {
		throwError({
			name,
			level: "domain",
			kind: "validation",
			userMessage,
			debugInfo,
			payload,
		} as AppError);
	}

	/**
	 * Выбрасывает доменную ошибку конфликта (conflict, 409).
	 */
	protected throwConflict<
		K extends Extract<TMeta["errors"], { kind: "conflict" }>["name"],
		E extends Extract<TMeta["errors"], { name: K }>,
	>(
		name: K,
		userMessage = "Конфликт состояния домена",
		debugInfo = "Действие конфликтует с текущим состоянием сущности",
		payload?: E["payload"],
	): never {
		throwError({
			name,
			level: "domain",
			kind: "conflict",
			userMessage,
			debugInfo,
			payload,
		} as AppError);
	}
}
