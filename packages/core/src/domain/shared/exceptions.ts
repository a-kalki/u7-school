/**
 * Исключение уровня домена.
 * Выбрасывается при нарушении инвариантов предметной области (например, невалидные данные).
 */
export class DomainException extends Error {
	readonly httpStatus: number;
	readonly userMessage: string;
	readonly debugInfo: string;
	readonly level = "domain" as const;

	constructor(
		name: string,
		userMessage: string,
		debugInfo: string,
		httpStatus = 422,
	) {
		super(userMessage);
		this.name = name;
		this.userMessage = userMessage;
		this.debugInfo = debugInfo;
		this.httpStatus = httpStatus;
	}
}
