import { describe, expect, mock, test } from "bun:test";
import type { User, UserFacade } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Course } from "#domain/course/entity";
import type { CourseRepo } from "#domain/course/repo";
import { Status } from "#domain/status";
import { PublishCourseUc } from "./publish-course-uc";

function makeUser(overrides: Partial<User> = {}): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Тест",
		telegramId: 1,
		roles: [Role.ADMIN],
		createdAt: "2026-05-01T12:00",
		...overrides,
	};
}

function makeCourse(authorId: string): Course {
	return {
		uuid: crypto.randomUUID(),
		kind: "modules",
		title: "Курс",
		description: "Описание",
		authorId,
		targetAudience: undefined,
		goal: undefined,
		result: undefined,
		rules: undefined,
		additional: undefined,
		tags: [],
		status: Status.DRAFT,
		createdAt: "2026-05-01T12:00",
		modules: [],
	} as Course;
}

function setupUc() {
	const save = mock(async (_course: Course): Promise<void> => {});
	const getByUuid = mock(
		async (_uuid: string): Promise<Course | undefined> => undefined,
	);
	const getAll = mock(async (): Promise<Course[]> => []);
	const repo: CourseRepo = { save, getByUuid, getAll };
	const getUserByUuid = mock(
		async (_uuid: string): Promise<User | undefined> => undefined,
	);
	const userExists = mock(async (_uuid: string): Promise<boolean> => false);
	const userFacade: UserFacade = { getUserByUuid, userExists, addRoleToUser: mock() };
	const uc = new PublishCourseUc();
	uc.init({
		courseRepo: repo,
		lessonRepo: {} as never,
		stepRepo: {} as never,
		userFacade,
	});
	return { save, getByUuid, getUserByUuid, repo, uc };
}

describe("PublishCourseUc", () => {
	describe("SUCCESS", () => {
		test("автор публикует свой курс", async () => {
			const { getByUuid, getUserByUuid, save, uc } = setupUc();
			const author = makeUser({ roles: [Role.MENTOR] });
			const course = makeCourse(author.uuid);
			getByUuid.mockResolvedValueOnce(course);
			getUserByUuid.mockResolvedValueOnce(author);

			const result = await uc.handle({ courseId: course.uuid }, author.uuid);

			expect((result as Course).status).toBe(Status.PUBLISHED);
			expect(save).toHaveBeenCalledTimes(1);
		});

		test("ADMIN публикует чужой курс", async () => {
			const { getByUuid, getUserByUuid, uc } = setupUc();
			const admin = makeUser();
			const course = makeCourse(crypto.randomUUID());
			getByUuid.mockResolvedValueOnce(course);
			getUserByUuid.mockResolvedValueOnce(admin);

			const result = await uc.handle({ courseId: course.uuid }, admin.uuid);

			expect((result as Course).status).toBe(Status.PUBLISHED);
		});
	});

	describe("FAIL", () => {
		test("отклоняет публикацию не-автором без прав ADMIN", async () => {
			const { getByUuid, getUserByUuid, uc } = setupUc();
			const course = makeCourse("author-id");
			const other = makeUser({ roles: [Role.STUDENT] });
			getByUuid.mockResolvedValueOnce(course);
			getUserByUuid.mockResolvedValueOnce(other);

			await expect(
				uc.handle({ courseId: course.uuid }, other.uuid),
			).rejects.toThrow("Недостаточно прав");
		});

		test("отклоняет несуществующий курс", async () => {
			const { getByUuid, getUserByUuid, uc } = setupUc();
			const admin = makeUser();
			const missingId = crypto.randomUUID();
			getByUuid.mockResolvedValueOnce(undefined);
			getUserByUuid.mockResolvedValueOnce(admin);

			await expect(
				uc.handle({ courseId: missingId }, admin.uuid),
			).rejects.toThrow("Курс не найден");
		});
	});
});
