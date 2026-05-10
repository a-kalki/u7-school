import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { UserFacade } from "#domain/facade";
import { Status } from "#domain/status";
import { CourseJsonRepo } from "#infra/db/course-json-repo";
import { FileMetadataJsonRepo } from "#infra/db/file-metadata-json-repo";
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
		fileMetadataRepo: new FileMetadataJsonRepo(nextPath("files")),
		userFacade: facade,
	});
	return mod;
}

describe("CourseApiModule", () => {
	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	test("create-course: ADMIN создаёт курс", async () => {
		const facade = new MockUserFacade();
		const admin = makeAdmin();
		facade.addUser(admin);

		const mod = setupModule(facade);
		const result = await mod.handle({
			name: "create-course",
			attrs: {
				title: "Курс JS",
				description: "Описание",
				kind: "modules",
				status: Status.DRAFT,
			},
			actorId: admin.uuid,
		});

		expect((result as { title: string }).title).toBe("Курс JS");
	});

	test("get-course: возвращает созданный курс", async () => {
		const facade = new MockUserFacade();
		const admin = makeAdmin();
		facade.addUser(admin);

		const mod = setupModule(facade);
		const created = (await mod.handle({
			name: "create-course",
			attrs: {
				title: "Курс Python",
				description: "Описание",
				kind: "projects",
				status: Status.DRAFT,
			},
			actorId: admin.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "get-course",
			attrs: { uuid: created.uuid },
		});

		expect((result as { title: string }).title).toBe("Курс Python");
	});

	test("list-courses: возвращает список курсов", async () => {
		const facade = new MockUserFacade();
		const admin = makeAdmin();
		facade.addUser(admin);

		const mod = setupModule(facade);
		await mod.handle({
			name: "create-course",
			attrs: {
				title: "Курс 1",
				description: "Описание",
				kind: "modules",
				status: Status.DRAFT,
			},
			actorId: admin.uuid,
		});

		const result = await mod.handle({
			name: "list-courses",
			attrs: {},
		});

		expect((result as { courses: unknown[] }).courses).toHaveLength(1);
	});

	test("create-lesson: ADMIN создаёт урок", async () => {
		const facade = new MockUserFacade();
		const admin = makeAdmin();
		facade.addUser(admin);

		const mod = setupModule(facade);
		const course = (await mod.handle({
			name: "create-course",
			attrs: {
				title: "Курс",
				description: "Описание",
				kind: "modules",
				status: Status.DRAFT,
			},
			actorId: admin.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "create-lesson",
			attrs: {
				courseId: course.uuid,
				title: "Урок 1",
				status: Status.DRAFT,
				order: 1,
			},
			actorId: admin.uuid,
		});

		expect((result as { title: string }).title).toBe("Урок 1");
	});

	test("create-step: ADMIN создаёт шаг", async () => {
		const facade = new MockUserFacade();
		const admin = makeAdmin();
		facade.addUser(admin);

		const mod = setupModule(facade);
		const course = (await mod.handle({
			name: "create-course",
			attrs: {
				title: "Курс",
				description: "Описание",
				kind: "modules",
				status: Status.DRAFT,
			},
			actorId: admin.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "create-step",
			attrs: {
				courseId: course.uuid,
				kind: "text",
				description: "Шаг 1",
				status: Status.DRAFT,
				order: 1,
			},
			actorId: admin.uuid,
		});

		expect((result as { kind: string }).kind).toBe("text");
	});

	test("create-file-metadata: ADMIN создаёт метаданные файла", async () => {
		const facade = new MockUserFacade();
		const admin = makeAdmin();
		facade.addUser(admin);

		const mod = setupModule(facade);
		const course = (await mod.handle({
			name: "create-course",
			attrs: {
				title: "Курс",
				description: "Описание",
				kind: "modules",
				status: Status.DRAFT,
			},
			actorId: admin.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "create-file-metadata",
			attrs: {
				courseId: course.uuid,
				name: "test.pdf",
				url: "https://example.com/test.pdf",
				mimeType: "application/pdf",
			},
			actorId: admin.uuid,
		});

		expect((result as { name: string }).name).toBe("test.pdf");
	});

	test("MENTOR может создать курс", async () => {
		const facade = new MockUserFacade();
		const mentor = makeMentor();
		facade.addUser(mentor);

		const mod = setupModule(facade);
		const result = await mod.handle({
			name: "create-course",
			attrs: {
				title: "Курс ментора",
				description: "Описание",
				kind: "projects",
				status: Status.DRAFT,
			},
			actorId: mentor.uuid,
		});

		expect((result as { title: string }).title).toBe("Курс ментора");
	});
});
