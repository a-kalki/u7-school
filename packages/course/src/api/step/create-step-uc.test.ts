import { describe, expect, mock, test } from "bun:test";
import type { User, UserFacade } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Course } from "#domain/course/entity";
import type { CourseRepo } from "#domain/course/repo";
import { Status } from "#domain/status";
import type { Step } from "#domain/step/entity";
import type { StepRepo } from "#domain/step/repo";
import { CreateStepUc } from "./create-step-uc";

function makeUser(r: Role[] = [Role.ADMIN]): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Т",
		telegramId: 1,
		roles: r,
		createdAt: "2026-05-01T12:00",
	};
}

function makeCourse(authorId: string): Course {
	return {
		uuid: crypto.randomUUID(),
		kind: "modules" as const,
		title: "К",
		description: "О",
		authorId,
		status: Status.DRAFT,
		createdAt: "2026-05-01T12:00",
		modules: [],
	} as Course;
}

function setupUc() {
	const courseGetByUuid = mock(
		async (_uuid: string): Promise<Course | undefined> => undefined,
	);
	const courseRepo: CourseRepo = {
		save: mock(async () => {}),
		getByUuid: courseGetByUuid,
		getAll: mock(async () => []),
	};
	const stepSave = mock(async (_s: Step): Promise<void> => {});
	const stepRepo: StepRepo = {
		save: stepSave,
		getByUuid: mock(async () => undefined),
		getByIds: mock(async () => []),
		getByCourseId: mock(async () => []),
	};
	const getUserByUuid = mock(
		async (_uuid: string): Promise<User | undefined> => undefined,
	);
	const userFacade: UserFacade = {
		getUserByUuid,
		userExists: mock(async () => false),
	};
	const uc = new CreateStepUc();
	uc.init({
		courseRepo,
		lessonRepo: {} as never,
		stepRepo,
		userFacade,
	});
	return { courseGetByUuid, stepSave, getUserByUuid, uc };
}

describe("CreateStepUc", () => {
	describe("SUCCESS", () => {
		test("ADMIN создаёт текстовый шаг в своём курсе", async () => {
			const { courseGetByUuid, stepSave, getUserByUuid, uc } = setupUc();
			const admin = makeUser();
			const course = makeCourse(admin.uuid);
			getUserByUuid.mockResolvedValueOnce(admin);
			courseGetByUuid.mockResolvedValueOnce(course);

			const result = await uc.handle(
				{
					courseId: course.uuid,
					kind: "text",
					content: "Шаг 1",
				},
				admin.uuid,
			);

			expect((result as Step).kind).toBe("text");
			expect(stepSave).toHaveBeenCalledTimes(1);
		});
	});

	describe("FAIL", () => {
		test("отклоняет STUDENT", async () => {
			const { getUserByUuid, uc } = setupUc();
			getUserByUuid.mockResolvedValueOnce(makeUser([Role.STUDENT]));

			await expect(
				uc.handle(
					{
						courseId: crypto.randomUUID(),
						kind: "text",
						content: "Ш",
					},
					"actor-id",
				),
			).rejects.toThrow("Недостаточно прав для создания шага");
		});

		test("отклоняет не автора курса", async () => {
			const { courseGetByUuid, getUserByUuid, uc } = setupUc();
			const mentor = makeUser([Role.MENTOR]);
			getUserByUuid.mockResolvedValueOnce(mentor);
			courseGetByUuid.mockResolvedValueOnce(makeCourse(crypto.randomUUID()));

			await expect(
				uc.handle(
					{
						courseId: crypto.randomUUID(),
						kind: "text",
						content: "Ш",
					},
					mentor.uuid,
				),
			).rejects.toThrow("Вы не являетесь автором курса");
		});
	});
});
