import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { type ApplicationAnswers, ApplicationAnswersSchema } from "./answers";
import { BaseDays } from "./base-days";
import { BaseTime } from "./base-time";
import { Experience } from "./experience";
import { Format } from "./format";
import { Goals } from "./goals";
import { Intensity } from "./intensity";
import { IntensiveTime } from "./intensive-time";
import { Source } from "./source";

describe("ApplicationAnswersSchema", () => {
	const validAnswers: ApplicationAnswers = {
		source: Source.TELEGRAM,
		interestReason: "Хочу сменить профессию",
		experience: Experience.BEGINNER,
		format: Format.ONLINE,
		goals: Goals.CAREER_CHANGE,
		intensity: Intensity.BASE,
		baseDays: BaseDays.MON_WED_FRI,
		baseTime: BaseTime.EVENING,
	};

	test("валидирует корректные ответы", () => {
		const result = v.safeParse(ApplicationAnswersSchema, validAnswers);
		expect(result.success).toBe(true);
	});

	test("валидирует минимальные ответы (без опциональных полей)", () => {
		const minimal = {
			source: Source.FRIEND,
			interestReason: "Интересно",
			experience: Experience.NONE,
			format: Format.ANY,
			goals: Goals.GENERAL,
			intensity: Intensity.UNDECIDED,
		};
		const result = v.safeParse(ApplicationAnswersSchema, minimal);
		expect(result.success).toBe(true);
	});

	test("отклоняет пустую причину интереса", () => {
		const invalid = { ...validAnswers, interestReason: "   " };
		const result = v.safeParse(ApplicationAnswersSchema, invalid);
		expect(result.success).toBe(false);
	});

	test("отклоняет некорректный источник", () => {
		const invalid = { ...validAnswers, source: "INVALID" };
		const result = v.safeParse(ApplicationAnswersSchema, invalid);
		expect(result.success).toBe(false);
	});

	test("принимает интенсивный поток с intensiveTime", () => {
		const intensive = {
			...validAnswers,
			intensity: Intensity.INTENSIVE,
			baseDays: undefined,
			baseTime: undefined,
			intensiveTime: IntensiveTime.MORNING,
		};
		const result = v.safeParse(ApplicationAnswersSchema, intensive);
		expect(result.success).toBe(true);
	});

	test("отклоняет некорректный опыт", () => {
		const invalid = { ...validAnswers, experience: "EXPERT" };
		const result = v.safeParse(ApplicationAnswersSchema, invalid);
		expect(result.success).toBe(false);
	});
});
