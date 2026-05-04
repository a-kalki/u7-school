import { describe, expect, test } from "bun:test";
import { Role } from "../../domain/user/roles";
import type { User } from "../../domain/user/user";
import { InMemoryUserRepository } from "../user/user-repository";
import { CourseCreatingUc } from "./course-creating-uc";
import { InMemoryCourseRepository } from "./course-repository";

async function addUser(
	repo: InMemoryUserRepository,
	u: Partial<User>,
): Promise<string> {
	const user: User = {
		uuid: u.uuid ?? crypto.randomUUID(),
		name: u.name ?? "X",
		telegramId: u.telegramId ?? 1,
		roles: u.roles ?? [Role.MENTOR],
		createdAt: "2026-05-01T12:00",
	};
	await repo.save(user);
	return user.uuid;
}

describe("CourseCreatingUc", () => {
	test("MENTOR создаёт курс", async () => {
		const userRepo = new InMemoryUserRepository();
		const courseRepo = new InMemoryCourseRepository();
		const mentorId = await addUser(userRepo, {
			roles: [Role.MENTOR],
			telegramId: 10,
		});
		const uc = new CourseCreatingUc(courseRepo, userRepo);
		const course = await uc.execute(
			{ title: "Курс", description: "Описание", authorId: mentorId },
			mentorId,
		);
		expect(course.title).toBe("Курс");
	});

	test("STUDENT не может создать", async () => {
		const userRepo = new InMemoryUserRepository();
		const studentId = await addUser(userRepo, {
			roles: [Role.STUDENT],
			telegramId: 20,
		});
		const uc = new CourseCreatingUc(new InMemoryCourseRepository(), userRepo);
		expect(
			uc.execute(
				{ title: "X", description: "X", authorId: studentId },
				studentId,
			),
		).rejects.toThrow("Недостаточно прав для создания курса");
	});

	test("автор не существует → notFound", async () => {
		const userRepo = new InMemoryUserRepository();
		const mentorId = await addUser(userRepo, {
			roles: [Role.MENTOR],
			telegramId: 30,
		});
		const uc = new CourseCreatingUc(new InMemoryCourseRepository(), userRepo);
		expect(
			uc.execute(
				{
					title: "X",
					description: "X",
					authorId: "00000000-0000-0000-0000-000000000000",
				},
				mentorId,
			),
		).rejects.toThrow("Автор курса не найден");
	});
});
