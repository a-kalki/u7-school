import * as v from "valibot";

/**
 * Желаемая интенсивность обучения.
 */
export enum Intensity {
	/** Базовый поток — 2-3 раза в неделю */
	BASE = "BASE",
	/** Интенсивный поток — ежедневно */
	INTENSIVE = "INTENSIVE",
	/** Пока не решил(а) */
	UNDECIDED = "UNDECIDED",
}

/** Схема валидации интенсивности */
export const IntensitySchema = v.picklist(
	Object.values(Intensity),
	"Недопустимая интенсивность",
);
