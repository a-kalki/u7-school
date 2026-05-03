import { describe, expect, test } from "bun:test";
import { Role } from "../domain/user/roles";
import type { User } from "../domain/user/user";
import { InMemoryCourseRepository } from "./course/course_repository";
import { CoreModule } from "./module";
import { InMemoryUserRepository } from "./user/user_repository";

async function addUser(
	repo: InMemoryUserRepository,
	u: Partial<User>,
): Promise<User> {
	const user: User = {
		uuid: u.uuid ?? crypto.randomUUID(),
		name: u.name ?? "X",
		telegramId: u.telegramId ?? Math.floor(Math.random() * 100000),
		role: u.role ?? Role.ADMIN,
		createdAt: "2026-05-01T12:00",
	};
	await repo.save(user);
	return user;
}

describe("CoreModule", () => {
	test("create-user: bootstrap создаёт ADMIN", async () => {
		const m = new CoreModule({
			userRepo: new InMemoryUserRepository(),
			courseRepo: new InMemoryCourseRepository(),
		});
		const r = await m.handle({
			name: "create-user",
			attrs: { name: "А", telegramId: 1, role: Role.ADMIN },
		});
		expect((r as User).role).toBe(Role.ADMIN);
	});

	test("create-user: с actorId создаёт пользователя", async () => {
		const userRepo = new InMemoryUserRepository();
		const m = new CoreModule({
			userRepo,
			courseRepo: new InMemoryCourseRepository(),
		});
		const admin = await addUser(userRepo, {
			role: Role.ADMIN,
			telegramId: 100,
		});
		const r = await m.handle({
			name: "create-user",
			user: admin.uuid,
			attrs: { name: "Б", telegramId: 200, role: Role.STUDENT },
		});
		expect((r as User).name).toBe("Б");
	});

	test("create-course: MENTOR создаёт курс", async () => {
		const userRepo = new InMemoryUserRepository();
		const m = new CoreModule({
			userRepo,
			courseRepo: new InMemoryCourseRepository(),
		});
		const mentor = await addUser(userRepo, {
			role: Role.MENTOR,
			telegramId: 300,
		});
		const r = await m.handle({
			name: "create-course",
			user: mentor.uuid,
			attrs: { title: "К", description: "Д", authorId: mentor.uuid },
		});
		expect((r as { title: string }).title).toBe("К");
	});

	test("неизвестная команда — ошибка", async () => {
		const m = new CoreModule({
			userRepo: new InMemoryUserRepository(),
			courseRepo: new InMemoryCourseRepository(),
		});
		await expect(m.handle({ name: "unknown", attrs: {} })).rejects.toThrow(
			"Неизвестная команда",
		);
	});
});
