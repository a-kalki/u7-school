import * as v from "valibot";

/**
 * Уровень опыта программирования кандидата.
 */
export enum Experience {
	/** Нет опыта */
	NONE = "NONE",
	/** Начинающий */
	BEGINNER = "BEGINNER",
	/** Средний */
	INTERMEDIATE = "INTERMEDIATE",
	/** Продвинутый */
	ADVANCED = "ADVANCED",
}

/** Схема валидации уровня опыта */
export const ExperienceSchema = v.picklist(
	Object.values(Experience),
	"Недопустимый уровень опыта",
);
