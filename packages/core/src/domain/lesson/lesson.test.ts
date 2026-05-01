import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Status } from "../shared/status";
import { type Lesson, LessonSchema } from "./lesson";
import type { Step } from "./step";

describe("Схема урока (Lesson)", () => {
	const baseStep: Step = {
		kind: "text",
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		description: "Описание шага",
		order: 1,
		createdAt: "2026-05-01T12:00",
	};

	const validLesson: Lesson = {
		uuid: "770e8400-e29b-41d4-a716-446655440002",
		title: "Введение в TypeScript",
		status: Status.DRAFT,
		order: 1,
		createdAt: "2026-05-01T12:00",
		steps: [baseStep],
	};

	test("должна принимать валидный урок", () => {
		expect(v.safeParse(LessonSchema, validLesson).success).toBe(true);
	});

	test("должна принимать урок с estimatedMinutes и mentorSteps", () => {
		expect(
			v.safeParse(LessonSchema, {
				...validLesson,
				estimatedMinutes: 45,
				mentorSteps: [baseStep],
			}).success,
		).toBe(true);
	});

	test("должна принимать урок с пустыми steps", () => {
		expect(
			v.safeParse(LessonSchema, { ...validLesson, steps: [] }).success,
		).toBe(true);
	});

	test("должна отклонять урок с нулевым estimatedMinutes", () => {
		expect(
			v.safeParse(LessonSchema, { ...validLesson, estimatedMinutes: 0 })
				.success,
		).toBe(false);
	});
});
