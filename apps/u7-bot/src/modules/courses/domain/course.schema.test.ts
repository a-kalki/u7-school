import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { CourseSchema, LessonSchema, ModuleSchema } from "./course.schema";

describe("Course Domain Schemas", () => {
	describe("LessonSchema", () => {
		test("should validate a valid lesson", () => {
			const lesson = {
				id: "intro",
				name: "Introduction",
				url: "https://www.w3schools.com/html/default.asp",
			};
			const result = v.safeParse(LessonSchema, lesson);
			expect(result.success).toBe(true);
		});

		test("should fail if id is missing", () => {
			const lesson = {
				name: "Introduction",
				url: "https://www.w3schools.com/html/default.asp",
			};
			const result = v.safeParse(LessonSchema, lesson);
			expect(result.success).toBe(false);
		});
	});

	describe("ModuleSchema", () => {
		test("should validate a valid module", () => {
			const module = {
				id: "html-basic",
				name: "HTML Basic",
				lessons: [
					{
						id: "intro",
						name: "Introduction",
						url: "https://www.w3schools.com/html/default.asp",
					},
				],
			};
			const result = v.safeParse(ModuleSchema, module);
			expect(result.success).toBe(true);
		});
	});

	describe("CourseSchema", () => {
		test("should validate a valid course with w3c- prefix", () => {
			const course = {
				id: "w3c-html",
				name: "HTML Tutorial",
				modules: [
					{
						id: "html-basic",
						name: "HTML Basic",
						lessons: [],
					},
				],
			};
			const result = v.safeParse(CourseSchema, course);
			expect(result.success).toBe(true);
		});

		test("should fail if id does not start with w3c-", () => {
			const course = {
				id: "html",
				name: "HTML Tutorial",
				modules: [],
			};
			const result = v.safeParse(CourseSchema, course);
			expect(result.success).toBe(false);
		});
	});
});
