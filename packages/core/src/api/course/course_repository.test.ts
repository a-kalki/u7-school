import { describe, expect, test } from "bun:test";
import type { CourseWithModules } from "../../domain/course/course";
import { Status } from "../../domain/shared/status";
import { InMemoryCourseRepository } from "./course_repository";

const course: CourseWithModules = {
	uuid: "c",
	title: "T",
	description: "D",
	authorId: "a",
	kind: "modules",
	modules: [],
	status: Status.DRAFT,
	createdAt: "2026-05-01T12:00",
};

describe("CourseRepository (in-memory)", () => {
	test("сохранение и получение", async () => {
		const repo = new InMemoryCourseRepository();
		await repo.save(course);
		expect(await repo.getByUuid("c")).toEqual(course);
	});
	test("несуществующий → undefined", async () => {
		const repo = new InMemoryCourseRepository();
		expect(await repo.getByUuid("x")).toBeUndefined();
	});
	test("дубликат → ошибка", async () => {
		const repo = new InMemoryCourseRepository();
		await repo.save(course);
		await expect(repo.save(course)).rejects.toThrow();
	});
});
