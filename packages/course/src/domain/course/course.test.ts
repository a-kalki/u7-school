import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import type { Module } from "../module/module";
import type { Project } from "../project/project";
import { Status } from "../shared/status";
import {
	CourseSchema,
	type CourseWithModules,
	type CourseWithProjects,
} from "./course";

describe("Схема курса (Course)", () => {
	const baseFields = {
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		title: "Основы TypeScript",
		description: "Курс для начинающих",
		authorId: "660e8400-e29b-41d4-a716-446655440001",
		status: Status.DRAFT,
		createdAt: "2026-05-01T12:00",
	};

	const sampleModule: Module = {
		uuid: "770e8400-e29b-41d4-a716-446655440002",
		title: "Модуль 1",
		status: Status.DRAFT,
		order: 1,
		createdAt: "2026-05-01T12:00",
		projects: [],
	};

	const sampleProject: Project = {
		uuid: "990e8400-e29b-41d4-a716-446655440004",
		title: "Проект 1",
		status: Status.DRAFT,
		order: 1,
		createdAt: "2026-05-01T12:00",
		lessons: [],
	};

	test("должна принимать курс с модулями", () => {
		const c: CourseWithModules = {
			...baseFields,
			kind: "modules",
			modules: [sampleModule],
		};
		expect(v.safeParse(CourseSchema, c).success).toBe(true);
	});

	test("должна принимать курс с проектами", () => {
		const c: CourseWithProjects = {
			...baseFields,
			kind: "projects",
			projects: [sampleProject],
		};
		expect(v.safeParse(CourseSchema, c).success).toBe(true);
	});

	test("должна принимать курс с пустым массивом модулей", () => {
		const c: CourseWithModules = {
			...baseFields,
			kind: "modules",
			modules: [],
		};
		expect(v.safeParse(CourseSchema, c).success).toBe(true);
	});

	test("должна принимать курс без updatedAt (ещё не редактировался)", () => {
		const c: CourseWithModules = {
			...baseFields,
			kind: "modules",
			modules: [],
		};
		expect(v.safeParse(CourseSchema, c).success).toBe(true);
	});

	test("должна принимать курс с тегами", () => {
		const c: CourseWithModules = {
			...baseFields,
			kind: "modules",
			modules: [],
			tags: ["typescript", "beginner"],
		};
		expect(v.safeParse(CourseSchema, c).success).toBe(true);
	});

	test("должна отклонять невалидный статус", () => {
		const c = {
			...baseFields,
			status: "deleted",
			kind: "modules" as const,
			modules: [],
		};
		expect(v.safeParse(CourseSchema, c).success).toBe(false);
	});
});
