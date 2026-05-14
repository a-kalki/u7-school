import * as v from "valibot";

/**
 * Цели обучения кандидата.
 */
export enum Goals {
	/** Смена профессии */
	CAREER_CHANGE = "CAREER_CHANGE",
	/** Повышение квалификации */
	SKILL_UP = "SKILL_UP",
	/** Запуск собственного проекта */
	OWN_PROJECT = "OWN_PROJECT",
	/** Общее развитие и интерес */
	GENERAL = "GENERAL",
}

/** Схема валидации целей обучения */
export const GoalsSchema = v.picklist(
	Object.values(Goals),
	"Недопустимая цель обучения",
);
