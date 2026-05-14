import * as v from "valibot";
import { BaseDays } from "./base-days";
import { BaseTime } from "./base-time";
import { Experience } from "./experience";
import { Format } from "./format";
import { Goals } from "./goals";
import { Intensity } from "./intensity";
import { IntensiveTime } from "./intensive-time";
import { Source } from "./source";

/**
 * Схема ответов на анкету кандидата.
 * Использует enum-коды для статистики и аналитики.
 */
export const ApplicationAnswersSchema = v.object({
	/** Откуда узнал о школе */
	source: v.picklist(Object.values(Source)),
	/** Причина интереса к школе */
	interestReason: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Причина интереса не может быть пустой"),
	),
	/** Уровень опыта программирования */
	experience: v.picklist(Object.values(Experience)),
	/** Предпочитаемый формат обучения */
	format: v.picklist(Object.values(Format)),
	/** Цели обучения */
	goals: v.picklist(Object.values(Goals)),
	/** Желаемая интенсивность */
	intensity: v.picklist(Object.values(Intensity)),
	/** Дни занятий для базового потока (опционально) */
	baseDays: v.optional(v.picklist(Object.values(BaseDays))),
	/** Время занятий для базового потока (опционально) */
	baseTime: v.optional(v.picklist(Object.values(BaseTime))),
	/** Время занятий для интенсивного потока (опционально) */
	intensiveTime: v.optional(v.picklist(Object.values(IntensiveTime))),
});

/** Ответы на анкету кандидата */
export type ApplicationAnswers = v.InferOutput<typeof ApplicationAnswersSchema>;
