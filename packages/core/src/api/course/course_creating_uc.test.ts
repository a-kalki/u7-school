import { describe, expect, test } from "bun:test";
import type { User } from "../../domain/user/user";
import { InMemoryUserRepository } from "../user/user_repository";
import { InMemoryCourseRepository } from "./course_repository";
import { CourseCreatingUc } from "./course_creating_uc";
import { DomainException } from "../../domain/shared/exceptions";

async function addUser(repo: InMemoryUserRepository, u: Partial<User>): Promise<string> {
	const user: User = { uuid: u.uuid ?? crypto.randomUUID(), name: u.name ?? "X",
		telegramId: u.telegramId ?? 1, role: u.role ?? "MENTOR", createdAt: "2026-05-01T12:00" };
	await repo.save(user);
	return user.uuid;
}

describe("CourseCreatingUc", () => {
	test("MENTOR создаёт курс", async () => {
		const userRepo = new InMemoryUserRepository();
		const courseRepo = new InMemoryCourseRepository();
		const mentorId = await addUser(userRepo, { role: "MENTOR", telegramId: 10 });
		const uc = new CourseCreatingUc(courseRepo, userRepo);
		const course = await uc.execute(
			{ title: "Курс", description: "Описание", authorId: mentorId }, mentorId);
		expect(course.title).toBe("Курс");
	});

	test("STUDENT не может создать", async () => {
		const userRepo = new InMemoryUserRepository();
		const studentId = await addUser(userRepo, { role: "STUDENT", telegramId: 20 });
		const uc = new CourseCreatingUc(new InMemoryCourseRepository(), userRepo);
		await expect(uc.execute(
			{ title: "X", description: "X", authorId: studentId }, studentId,
		)).rejects.toThrow(DomainException);
	});

	test("автор не существует → notFound", async () => {
		const userRepo = new InMemoryUserRepository();
		const mentorId = await addUser(userRepo, { role: "MENTOR", telegramId: 30 });
		const uc = new CourseCreatingUc(new InMemoryCourseRepository(), userRepo);
		await expect(uc.execute(
			{ title: "X", description: "X", authorId: "00000000-0000-0000-0000-000000000000" }, mentorId,
		)).rejects.toThrow("Автор курса не найден");
	});
});
