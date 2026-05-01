import { describe, expect, test } from "bun:test";

describe("Public API (index.ts)", () => {
	test("должен экспортировать все схемы и типы", async () => {
		const api = await import("./index");

		// User
		expect(api.UserSchema).toBeDefined();
		expect(api.Role).toBeDefined();
		expect(api.RoleSchema).toBeDefined();

		// Course
		expect(api.CourseSchema).toBeDefined();

		// Module
		expect(api.ModuleSchema).toBeDefined();

		// Project
		expect(api.ProjectSchema).toBeDefined();

		// Lesson
		expect(api.LessonSchema).toBeDefined();

		// Step
		expect(api.StepSchema).toBeDefined();

		// File
		expect(api.FileMetadataSchema).toBeDefined();

		// Status
		expect(api.Status).toBeDefined();
		expect(api.StatusSchema).toBeDefined();
	});
});
