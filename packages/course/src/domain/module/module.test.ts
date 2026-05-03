import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Status } from "../shared/status";
import { type Module, ModuleSchema } from "./module";

describe("Схема модуля (Module)", () => {
	const validModule: Module = {
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		title: "Модуль с проектами",
		status: Status.DRAFT,
		order: 1,
		createdAt: "2026-05-01T12:00",
		projects: [],
	};

	test("должна принимать валидный модуль", () => {
		expect(v.safeParse(ModuleSchema, validModule).success).toBe(true);
	});

	test("должна принимать модуль с пустым массивом проектов", () => {
		expect(
			v.safeParse(ModuleSchema, { ...validModule, projects: [] }).success,
		).toBe(true);
	});

	test("должна принимать модуль без updatedAt", () => {
		const { updatedAt, ...rest } = validModule;
		expect(v.safeParse(ModuleSchema, rest).success).toBe(true);
	});

	test("должна отклонять модуль без проектов", () => {
		const { projects, ...rest } = validModule;
		expect(v.safeParse(ModuleSchema, rest).success).toBe(false);
	});
});
