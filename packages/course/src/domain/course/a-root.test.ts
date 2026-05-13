import { describe, expect, test } from "bun:test";
import { Status } from "../status";
import { CourseAr } from "./a-root";

const authorId = crypto.randomUUID();

const enrichCmd = {
	courseId: "unused",
	targetAudience: "Новички",
	goal: "Научиться",
	result: "Уметь",
	rules: "Правила",
	additional: "Дополнительно",
	tags: ["js", "web"],
};

const moduleCmd = {
	courseId: "unused",
	title: "Модуль 1",
	goal: "Цель модуля",
	result: undefined,
	additional: undefined,
};

const projectCmd = {
	courseId: "unused",
	title: "Проект 1",
	goal: undefined,
	result: undefined,
	additional: undefined,
};

describe("CourseAr", () => {
	describe("create", () => {
		test("создаёт курс с kind=modules", () => {
			const ar = CourseAr.create(
				"Курс JS",
				"Описание курса",
				"modules",
				authorId,
			);
			expect(ar.state.kind).toBe("modules");
			expect(ar.state.title).toBe("Курс JS");
			expect(ar.state.authorId).toBe(authorId);
			expect(ar.state.status).toBe(Status.DRAFT);
			expect(ar.state.uuid).toMatch(
				/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
			);
			if (ar.state.kind === "modules") {
				expect(ar.state.modules).toEqual([]);
			}
		});

		test("создаёт курс с kind=projects", () => {
			const ar = CourseAr.create(
				"Курс Python",
				"Описание",
				"projects",
				authorId,
			);
			expect(ar.state.kind).toBe("projects");
			if (ar.state.kind === "projects") {
				expect(ar.state.projects).toEqual([]);
			}
		});

		test("генерирует UUID и createdAt", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
		});

		test("не создаёт updatedAt при создании", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			expect(ar.state.updatedAt).toBeUndefined();
		});

		test("опциональные поля undefined по умолчанию", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			expect(ar.state.targetAudience).toBeUndefined();
			expect(ar.state.goal).toBeUndefined();
			expect(ar.state.tags).toEqual([]);
		});
	});

	describe("enrich", () => {
		test("устанавливает дополнительные поля", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			ar.enrich(enrichCmd);

			expect(ar.state.targetAudience).toBe("Новички");
			expect(ar.state.goal).toBe("Научиться");
			expect(ar.state.result).toBe("Уметь");
			expect(ar.state.rules).toBe("Правила");
			expect(ar.state.additional).toBe("Дополнительно");
			expect(ar.state.tags).toEqual(["js", "web"]);
			expect(ar.state.updatedAt).toBeDefined();
		});

		test("не трогает modules при enrich", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			if (ar.state.kind !== "modules") throw new Error("Expected modules");

			ar.enrich(enrichCmd);
			expect(ar.state.modules).toEqual([]);
		});
	});

	describe("addModule", () => {
		test("добавляет модуль к курсу kind=modules", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			ar.addModule(moduleCmd);

			if (ar.state.kind !== "modules") throw new Error("Expected modules");
			expect(ar.state.modules).toHaveLength(1);
			expect(ar.state.modules[0]?.title).toBe("Модуль 1");
			expect(ar.state.modules[0]?.status).toBe(Status.DRAFT);
			expect(ar.state.updatedAt).toBeDefined();
		});

		test("добавляет несколько модулей", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			ar.addModule(moduleCmd);
			ar.addModule({ ...moduleCmd, title: "Модуль 2" });

			if (ar.state.kind !== "modules") throw new Error("Expected modules");
			expect(ar.state.modules).toHaveLength(2);
			expect(ar.state.modules[1]?.title).toBe("Модуль 2");
		});

		test("выбрасывает ошибку для kind=projects", () => {
			const ar = CourseAr.create("Курс", "Описание", "projects", authorId);
			expect(() => ar.addModule(moduleCmd)).toThrow(
				"Нельзя добавить модуль в курс с kind='projects'",
			);
		});
	});

	describe("addProject", () => {
		test("добавляет проект к курсу kind=projects", () => {
			const ar = CourseAr.create("Курс", "Описание", "projects", authorId);
			ar.addProject(projectCmd);

			if (ar.state.kind !== "projects") throw new Error("Expected projects");
			expect(ar.state.projects).toHaveLength(1);
			expect(ar.state.projects[0]?.title).toBe("Проект 1");
		});

		test("выбрасывает ошибку для kind=modules", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			expect(() => ar.addProject(projectCmd)).toThrow(
				"Нельзя добавить проект в курс с kind='modules'",
			);
		});
	});

	describe("addProjectToModule", () => {
		test("добавляет проект в модуль курса kind=modules", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			ar.addModule(moduleCmd);

			if (ar.state.kind !== "modules") throw new Error("Expected modules");
			const moduleUuid = ar.state.modules[0]?.uuid as string;

			ar.addProjectToModule(moduleUuid, projectCmd);

			expect(ar.state.modules[0]?.projects).toHaveLength(1);
			expect(ar.state.modules[0]?.projects[0]?.title).toBe("Проект 1");
			expect(ar.state.updatedAt).toBeDefined();
		});

		test("выбрасывает ошибку если модуль не найден", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			expect(() =>
				ar.addProjectToModule(crypto.randomUUID(), projectCmd),
			).toThrow("Модуль не найден");
		});

		test("выбрасывает ошибку для kind=projects", () => {
			const ar = CourseAr.create("Курс", "Описание", "projects", authorId);
			expect(() =>
				ar.addProjectToModule(crypto.randomUUID(), projectCmd),
			).toThrow("Нельзя добавить проект в модуль курса с kind='projects'");
		});
	});

	describe("publish", () => {
		test("меняет статус на PUBLISHED", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			expect(ar.state.status).toBe(Status.DRAFT);

			ar.publish();
			expect(ar.state.status).toBe(Status.PUBLISHED);
			expect(ar.state.updatedAt).toBeDefined();
		});
	});

	describe("полный жизненный цикл", () => {
		test("create → enrich → addModule → publish", () => {
			const ar = CourseAr.create("Курс", "Описание", "modules", authorId);
			ar.enrich(enrichCmd);
			ar.addModule(moduleCmd);
			ar.publish();

			expect(ar.state.title).toBe("Курс");
			expect(ar.state.targetAudience).toBe("Новички");
			if (ar.state.kind === "modules") {
				expect(ar.state.modules).toHaveLength(1);
			}
			expect(ar.state.status).toBe(Status.PUBLISHED);
		});
	});
});
