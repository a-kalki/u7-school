import * as v from "valibot";

/**
 * Источник, откуда кандидат узнал о школе.
 */
export enum Source {
	/** Telegram-канал */
	TELEGRAM = "TELEGRAM",
	/** Instagram */
	INSTAGRAM = "INSTAGRAM",
	/** Рекомендация друга */
	FRIEND = "FRIEND",
	/** Поиск в интернете */
	SEARCH = "SEARCH",
	/** Другое */
	OTHER = "OTHER",
}

/** Схема валидации источника */
export const SourceSchema = v.picklist(
	Object.values(Source),
	"Недопустимый источник",
);
