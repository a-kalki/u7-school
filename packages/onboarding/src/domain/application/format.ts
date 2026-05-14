import * as v from "valibot";

/**
 * Предпочитаемый формат обучения.
 */
export enum Format {
	/** Онлайн */
	ONLINE = "ONLINE",
	/** Офлайн */
	OFFLINE = "OFFLINE",
	/** Не имеет значения */
	ANY = "ANY",
}

/** Схема валидации формата обучения */
export const FormatSchema = v.picklist(
	Object.values(Format),
	"Недопустимый формат обучения",
);
