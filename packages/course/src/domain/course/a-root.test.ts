import { describe, expect, test } from "bun:test";
import { Status } from "../status";
import { CourseAr } from "./a-root";

const modulesCmd = {
	title: "Курс JS",
	description: "Описание курса",
	kind: "modules" as const,
	status: Status.DRAFT,
	modules: [
		{
			uuid: crypto.randomUUID(),
			title: "Модуль 1",
			status: Status.DRAFT,
			order: 1,
			createdAt: "2026-05-01T12:00",
		},
	],
};

const projectsCmd = {
	title: "Курс Python",
	description: "Описание",
	kind: "projects" as const,
	status: Status.PUBLISHED,
	projects: [
		{
			uuid: crypto.randomUUID(),
			title: "Проект 1",
			status: Status.DRAFT,
			order: 1,
			createdAt: "2026-05-01T12:00",
			lessonIds: [],
		},
	],
};

describe("CourseAr", () => {
	describe("create", () => {
		test("создаёт курс с modules", () => {
			const ar = CourseAr.create(modulesCmd);
			expect(ar.state.kind).toBe("modules");
			expect(ar.state.title).toBe("Курс JS");
			expect(ar.state.uuid).toMatch(
				/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
			);
			if (ar.state.kind === "modules") {
				expect(ar.state.modules).toHaveLength(1);
				expect(ar.state.modules[0]?.title).toBe("Модуль 1");
			}
		});

		test("создаёт курс с projects", () => {
			const ar = CourseAr.create(projectsCmd);
			expect(ar.state.kind).toBe("projects");
			if (ar.state.kind === "projects") {
				expect(ar.state.projects).toHaveLength(1);
			}
		});

		test("генерирует UUID и createdAt", () => {
			const ar = CourseAr.create(modulesCmd);
			expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
		});

		test("не создаёт updatedAt при создании", () => {
			const ar = CourseAr.create(modulesCmd);
			expect(ar.state.updatedAt).toBeUndefined();
		});

		test("создаёт курс без модулей/проектов", () => {
			const ar = CourseAr.create({
				title: "Пустой",
				description: "Без модулей",
				kind: "modules",
				status: Status.DRAFT,
			});
			expect(ar.state.kind).toBe("modules");
			if (ar.state.kind === "modules") {
				expect(ar.state.modules).toEqual([]);
			}
		});
	});
});
