import * as v from "valibot";
import { BaseDaysSchema } from "./base-days";
import { BaseTimeSchema } from "./base-time";
import { ExperienceSchema } from "./experience";
import { FormatSchema } from "./format";
import { GoalsSchema } from "./goals";
import { IntensitySchema } from "./intensity";
import { IntensiveTimeSchema } from "./intensive-time";
import { SourceSchema } from "./source";

/**
 * Схема ответов на анкету кандидата.
 * Использует enum-коды для статистики и аналитики.
 */
export const ApplicationAnswersSchema = v.object({
	/** Откуда узнал о школе */
	source: SourceSchema,
	/** Причина интереса к школе */
	interestReason: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Причина интереса не может быть пустой"),
	),
	/** Уровень опыта программирования */
	experience: ExperienceSchema,
	/** Предпочитаемый формат обучения */
	format: FormatSchema,
	/** Цели обучения */
	goals: GoalsSchema,
	/** Желаемая интенсивность */
	intensity: IntensitySchema,
	/** Дни занятий для базового потока (опционально) */
	baseDays: v.optional(BaseDaysSchema),
	/** Время занятий для базового потока (опционально) */
	baseTime: v.optional(BaseTimeSchema),
	/** Время занятий для интенсивного потока (опционально) */
	intensiveTime: v.optional(IntensiveTimeSchema),
});

/** Ответы на анкету кандидата */
export type ApplicationAnswers = v.InferOutput<typeof ApplicationAnswersSchema>;
