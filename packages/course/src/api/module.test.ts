import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { User, UserFacade } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import { Status } from "#domain/status";
import { CourseJsonRepo } from "#infra/db/course-json-repo";
import { LessonJsonRepo } from "#infra/db/lesson-json-repo";
import { StepJsonRepo } from "#infra/db/step-json-repo";
import { CourseApiModule } from "./module";

const tmpDir = mkdtempSync("/tmp/course-api-module-test-");

/** In-memory заглушка фасада пользователей для тестов */
class MockUserFacade implements UserFacade {
	private users = new Map<string, User>();

	addUser(user: User): void {
		this.users.set(user.uuid, user);
	}

	async getUserByUuid(uuid: string): Promise<User | undefined> {
		return this.users.get(uuid);
	}

	async userExists(uuid: string): Promise<boolean> {
		return this.users.has(uuid);
	}
}

function makeAdmin(): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Админ",
		telegramId: 1,
		roles: [Role.ADMIN],
		createdAt: "2026-05-01T12:00",
	};
}

function makeMentor(): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Ментор",
		telegramId: 2,
		roles: [Role.MENTOR],
		createdAt: "2026-05-01T12:00",
	};
}

let seq = 0;
function nextPath(prefix: string): string {
	return join(tmpDir, `${prefix}-${seq++}.json`);
}

/** Создаёт модуль с уникальными временными JSON-репозиториями */
function setupModule(facade: MockUserFacade) {
	const mod = new CourseApiModule();
	mod.init({
		courseRepo: new CourseJsonRepo(nextPath("courses")),
		lessonRepo: new LessonJsonRepo(nextPath("lessons")),
		stepRepo: new StepJsonRepo(nextPath("steps")),
		userFacade: facade,
	});
	return mod;
}

/** Создаёт курс от имени ментора и возвращает его uuid */
async function createCourseAsMentor(
	mod: CourseApiModule,
	mentor: User,
	kind: "modules" | "projects" = "modules",
): Promise<string> {
	const result = await mod.handle({
		name: "create-course",
		attrs: { title: "Курс", description: "Описание", kind },
		actorId: mentor.uuid,
	});
	return (result as { uuid: string }).uuid;
}

describe("CourseApiModule", () => {
	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	test("create-course: MENTOR создаёт курс", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		const result = await mod.handle({
			name: "create-course",
			attrs: { title: "Курс JS", description: "Описание", kind: "modules" },
			actorId: mentor.uuid,
		});

		expect((result as { title: string }).title).toBe("Курс JS");
	});

	test("create-course: ADMIN не может создать курс", async () => {
		const facade = new MockUserFacade();
		const admin = makeAdmin();
		facade.addUser(admin);

		const mod = setupModule(facade);

		await expect(
			mod.handle({
				name: "create-course",
				attrs: { title: "X", description: "X", kind: "modules" },
				actorId: admin.uuid,
			}),
		).rejects.toThrow("Недостаточно прав для создания курса");
	});

	test("enrich-course: ADMIN обогащает курс ментора", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		const admin = makeAdmin();
		facade.addUser(mentor);
		facade.addUser(admin);

		const mod = setupModule(facade);
		const courseId = await createCourseAsMentor(mod, mentor);

		const result = await mod.handle({
			name: "enrich-course",
			attrs: {
				courseId,
				targetAudience: "Новички",
				goal: "Научиться",
				tags: ["js"],
			},
			actorId: admin.uuid,
		});

		expect((result as { targetAudience?: string }).targetAudience).toBe(
			"Новички",
		);
	});

	test("add-module: автор добавляет модуль", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		const courseId = await createCourseAsMentor(mod, mentor);

		const result = await mod.handle({
			name: "add-module",
			attrs: { courseId, title: "Модуль 1" },
			actorId: mentor.uuid,
		});

		const res = result as { kind: string; modules: { title: string }[] };
		expect(res.modules).toHaveLength(1);
		expect(res.modules[0]?.title).toBe("Модуль 1");
	});

	test("add-project-to-module: автор добавляет проект в модуль", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		const courseId = await createCourseAsMentor(mod, mentor);
		const addModResult = await mod.handle({
			name: "add-module",
			attrs: { courseId, title: "Модуль 1" },
			actorId: mentor.uuid,
		});
		const moduleUuid = (addModResult as { modules: { uuid: string }[] })
			.modules[0]?.uuid as string;

		const result = await mod.handle({
			name: "add-project-to-module",
			attrs: {
				courseId,
				moduleUuid,
				title: "Проект в модуле",
			},
			actorId: mentor.uuid,
		});

		const res = result as {
			modules: { projects: { title: string }[] }[];
		};
		expect(res.modules[0]?.projects).toHaveLength(1);
		expect(res.modules[0]?.projects[0]?.title).toBe("Проект в модуле");
	});

	test("publish-course: автор публикует курс", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		const courseId = await createCourseAsMentor(mod, mentor);

		const result = await mod.handle({
			name: "publish-course",
			attrs: { courseId },
			actorId: mentor.uuid,
		});

		expect((result as { status: string }).status).toBe(Status.PUBLISHED);
	});

	test("get-course: возвращает созданный курс", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		const courseId = await createCourseAsMentor(mod, mentor, "projects");

		const result = await mod.handle({
			name: "get-course",
			attrs: { uuid: courseId },
			actorId: mentor.uuid,
		});

		expect((result as { title: string }).title).toBe("Курс");
	});

	test("list-courses: возвращает список курсов", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		await createCourseAsMentor(mod, mentor);

		const result = await mod.handle({
			name: "list-courses",
			attrs: {},
			actorId: mentor.uuid,
		});

		expect(result as unknown[]).toHaveLength(1);
	});

	test("create-lesson: MENTOR создаёт урок в своём курсе", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		const courseId = await createCourseAsMentor(mod, mentor, "projects");

		// Добавляем проект в курс
		const withProject = await mod.handle({
			name: "add-project",
			attrs: { courseId, title: "Проект 1" },
			actorId: mentor.uuid,
		}) as { projects?: { uuid: string }[] };
		const projectId = withProject.projects?.[0]?.uuid ?? "";

		const result = await mod.handle({
			name: "create-lesson",
			attrs: { courseId, projectId, title: "Урок 1" },
			actorId: mentor.uuid,
		});

		expect((result as { title: string }).title).toBe("Урок 1");
	});

	test("create-step: MENTOR создаёт шаг в своём курсе", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		const courseId = await createCourseAsMentor(mod, mentor);

		const result = await mod.handle({
			name: "create-step",
			attrs: {
				courseId,
				kind: "text",
				content: "Шаг 1",
			},
			actorId: mentor.uuid,
		});

		expect((result as { kind: string }).kind).toBe("text");
	});
});
