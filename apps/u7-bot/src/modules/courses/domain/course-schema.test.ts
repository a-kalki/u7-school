import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { CourseSchema, LessonSchema, ModuleSchema } from "@u7/core";

describe("Course Domain Schemas", () => {
	describe("LessonSchema", () => {
		test("should validate a valid lesson", () => {
			const lesson = {
				uuid: crypto.randomUUID(),
				title: "Introduction",
				status: "draft",
				order: 0,
				createdAt: "2026-01-01T00:00",
				steps: [],
				mentorSteps: [],
			};
			const result = v.safeParse(LessonSchema, lesson);
			expect(result.success).toBe(true);
		});

		test("should fail if title is missing", () => {
			const lesson = {
				uuid: crypto.randomUUID(),
				status: "draft",
				order: 0,
				createdAt: "2026-01-01T00:00",
				steps: [],
				mentorSteps: [],
			};
			const result = v.safeParse(LessonSchema, lesson);
			expect(result.success).toBe(false);
		});
	});

	describe("ModuleSchema", () => {
		test("should validate a valid module", () => {
			const module = {
				uuid: crypto.randomUUID(),
				title: "HTML Basic",
				status: "draft",
				order: 0,
				createdAt: "2026-01-01T00:00",
				projects: [],
			};
			const result = v.safeParse(ModuleSchema, module);
			expect(result.success).toBe(true);
		});
	});

	describe("CourseSchema", () => {
		test("should validate a valid course with modules kind", () => {
			const course = {
				uuid: crypto.randomUUID(),
				title: "HTML Tutorial",
				description: "Learn HTML",
				authorId: crypto.randomUUID(),
				status: "draft",
				createdAt: "2026-01-01T00:00",
				kind: "modules",
				modules: [],
			};
			const result = v.safeParse(CourseSchema, course);
			expect(result.success).toBe(true);
		});

		test("should fail if kind is missing", () => {
			const course = {
				uuid: crypto.randomUUID(),
				title: "HTML Tutorial",
				description: "Learn HTML",
				authorId: crypto.randomUUID(),
				status: "draft",
				createdAt: "2026-01-01T00:00",
			};
			const result = v.safeParse(CourseSchema, course);
			expect(result.success).toBe(false);
		});
	});
});
