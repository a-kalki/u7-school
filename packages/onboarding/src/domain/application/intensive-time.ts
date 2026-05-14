import * as v from "valibot";

/**
 * Время занятий для интенсивного потока.
 */
export enum IntensiveTime {
	/** Утро (10:00 – 13:00) */
	MORNING = "MORNING",
	/** Вечер (19:00 – 22:00) */
	EVENING = "EVENING",
	/** Полный день (10:00 – 18:00) */
	FULL_DAY = "FULL_DAY",
}

/** Схема валидации времени интенсивного потока */
export const IntensiveTimeSchema = v.picklist(
	Object.values(IntensiveTime),
	"Недопустимое время интенсивного потока",
);
