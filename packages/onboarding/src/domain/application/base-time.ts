import * as v from "valibot";

/**
 * Время занятий для базового потока.
 */
export enum BaseTime {
	/** Утро (10:00 – 13:00) */
	MORNING = "MORNING",
	/** Вечер (19:00 – 22:00) */
	EVENING = "EVENING",
}

/** Схема валидации времени занятий */
export const BaseTimeSchema = v.picklist(
	Object.values(BaseTime),
	"Недопустимое время занятий",
);
