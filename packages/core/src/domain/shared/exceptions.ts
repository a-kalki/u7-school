/**
 * Базовый класс для всех исключений платформы.
 * Содержит поля, необходимые для передачи ошибок через разные интерфейсы (REST, бот, консоль).
 */
export abstract class AppException extends Error {
	readonly httpStatus: number;
	readonly userMessage: string;
	readonly debugInfo: string;
	readonly payload: unknown;
	abstract readonly level: "domain" | "api";

	constructor(
		name: string,
		userMessage: string,
		debugInfo: string,
		httpStatus: number,
		payload: unknown = null,
	) {
		super(userMessage);
		this.name = name;
		this.userMessage = userMessage;
		this.debugInfo = debugInfo;
		this.httpStatus = httpStatus;
		this.payload = payload;
	}

	/** Возвращает объект, готовый для вставки в HTTP-ответ / вывод бота / консоль */
	rest(): {
		error: string;
		message: string;
		status: number;
		payload: unknown;
	} {
		return {
			error: this.name,
			message: this.userMessage,
			status: this.httpStatus,
			payload: this.payload,
		};
	}
}

/**
 * Исключение уровня домена.
 * Выбрасывается при нарушении инвариантов предметной области.
 */
export class DomainException extends AppException {
	readonly level = "domain" as const;

	/** Ошибка валидации (невалидные данные, нарушение инварианта) */
	static validation(
		userMessage: string,
		debugInfo: string,
		payload: unknown = null,
	): DomainException {
		return new DomainException(
			"DomainValidationError",
			userMessage,
			debugInfo,
			422,
			payload,
		);
	}

	/** Нарушение бизнес-правила (например, дубликат) */
	static conflict(userMessage: string, debugInfo: string): DomainException {
		return new DomainException(
			"DomainConflictError",
			userMessage,
			debugInfo,
			409,
		);
	}

	/** Сущность не найдена */
	static notFound(
		entity: string,
		identifier: string,
	): DomainException {
		return new DomainException(
			"DomainNotFoundError",
			`${entity} не найден(а)`,
			`${entity} с идентификатором ${identifier} не найден(а)`,
			404,
		);
	}

	/** Нарушение прав доступа на уровне доменных правил (роль, владелец) */
	static accessDenied(
		userMessage: string,
		debugInfo: string,
	): DomainException {
		return new DomainException(
			"DomainAccessDeniedError",
			userMessage,
			debugInfo,
			403,
		);
	}
}

/**
 * Исключение уровня приложения.
 * Выбрасывается при нарушении прав доступа и других ошибках уровня api.
 */
export class ApiException extends AppException {
	readonly level = "api" as const;

	/** Недостаточно прав */
	static accessDenied(
		userMessage: string,
		debugInfo: string,
	): ApiException {
		return new ApiException(
			"AccessDeniedError",
			userMessage,
			debugInfo,
			403,
		);
	}
}
