import { describe, expect, test } from "bun:test";
import { Status } from "../shared/status";
import type { CourseWithModules } from "./course";
import { CourseAr } from "./course_ar";

const validCourse: CourseWithModules = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	title: "Основы TypeScript",
	description: "Курс для начинающих",
	authorId: "660e8400-e29b-41d4-a716-446655440001",
	kind: "modules",
	modules: [],
	status: Status.DRAFT,
	createdAt: "2026-05-01T12:00",
};

describe("Агрегат курса (CourseAr)", () => {
	test("должен создаваться из существующего Course и отдавать состояние", () => {
		const ar = new CourseAr(validCourse);
		expect(ar.state).toEqual(validCourse);
	});

	test("состояние иммутабельно через геттер", () => {
		const ar = new CourseAr(validCourse);
		const state = ar.state;
		// @ts-expect-error
		state.title = "Взлом";
		expect(ar.state.title).toBe("Основы TypeScript");
	});

	test("create должен создавать курс с корректным состоянием", () => {
		const ar = CourseAr.create({
			title: "Новый курс",
			description: "Описание",
			authorId: "660e8400-e29b-41d4-a716-446655440001",
		});
		expect(ar.state.title).toBe("Новый курс");
		expect(ar.state.kind).toBe("modules");
		expect(ar.state.status).toBe(Status.DRAFT);
		expect(ar.state.uuid).toBeString();
	});

	test("create должен выбрасывать DomainException при невалидной команде", () => {
		expect(() =>
			CourseAr.create({
				title: "",
				description: "desc",
				authorId: "660e8400-e29b-41d4-a716-446655440001",
			}),
		).toThrow("Некорректная команда создания курса");
	});

	test("changeTitle обновляет заголовок и updatedAt", () => {
		const ar = new CourseAr(validCourse);
		ar.changeTitle("Новый заголовок");
		expect(ar.state.title).toBe("Новый заголовок");
		expect(ar.state.updatedAt).toBeString();
	});

	test("changeDescription обновляет описание и updatedAt", () => {
		const ar = new CourseAr(validCourse);
		ar.changeDescription("Новое описание");
		expect(ar.state.description).toBe("Новое описание");
		expect(ar.state.updatedAt).toBeString();
	});

	test("changeTitle с пустой строкой выбрасывает", () => {
		const ar = new CourseAr(validCourse);
		expect(() => ar.changeTitle("")).toThrow("Некорректные данные курса");
	});
});
