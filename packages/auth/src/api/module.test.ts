import { describe, expect, test } from "bun:test";
import { Role } from "../domain/user/roles";
import type { User } from "../domain/user/user";
import { AuthApiModule } from "./auth-module";
import { InMemoryUserRepository } from "./user-repository-inmemory";

describe("AuthApiModule", () => {
	test("create-user: бутстрап создаёт ADMIN", async () => {
		const mod = new AuthApiModule();
		mod.init({ userRepo: new InMemoryUserRepository() });

		const result = await mod.handle({
			name: "create-user",
			attrs: { name: "А", telegramId: 1, roles: [Role.STUDENT] },
		});
		expect((result as User).roles).toEqual([Role.ADMIN]);
	});

	test("create-user: второй пользователь сохраняет роли", async () => {
		const repo = new InMemoryUserRepository();
		const mod = new AuthApiModule();
		mod.init({ userRepo: repo });

		await mod.handle({
			name: "create-user",
			attrs: { name: "Админ", telegramId: 1, roles: [Role.ADMIN] },
		});
		const result = await mod.handle({
			name: "create-user",
			attrs: { name: "Студент", telegramId: 2, roles: [Role.STUDENT] },
		});
		expect((result as User).roles).toEqual([Role.STUDENT]);
	});

	test("get-user: возвращает пользователя", async () => {
		const repo = new InMemoryUserRepository();
		const user: User = {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			name: "Иван",
			telegramId: 1,
			roles: [Role.ADMIN],
			createdAt: "2026-05-01T12:00",
		};
		await repo.save(user);

		const mod = new AuthApiModule();
		mod.init({ userRepo: repo });

		const result = await mod.handle({
			name: "get-user",
			attrs: { uuid: user.uuid },
		});
		expect((result as User).name).toBe("Иван");
	});

	test("list-users: возвращает список", async () => {
		const repo = new InMemoryUserRepository();
		const user: User = {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			name: "Иван",
			telegramId: 1,
			roles: [Role.ADMIN],
			createdAt: "2026-05-01T12:00",
		};
		await repo.save(user);

		const mod = new AuthApiModule();
		mod.init({ userRepo: repo });

		const result = await mod.handle({
			name: "list-users",
			attrs: {},
		});
		expect((result as User[])).toHaveLength(1);
	});

	test("get-user-by-telegram-id: находит пользователя", async () => {
		const repo = new InMemoryUserRepository();
		const user: User = {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			name: "Иван",
			telegramId: 12345,
			roles: [Role.ADMIN],
			createdAt: "2026-05-01T12:00",
		};
		await repo.save(user);

		const mod = new AuthApiModule();
		mod.init({ userRepo: repo });

		const result = await mod.handle({
			name: "get-user-by-telegram-id",
			attrs: { telegramId: 12345 },
		});
		expect((result as User).name).toBe("Иван");
	});

	test("неизвестная команда — ошибка", async () => {
		const mod = new AuthApiModule();
		mod.init({ userRepo: new InMemoryUserRepository() });

		await expect(
			mod.handle({ name: "unknown", attrs: {} }),
		).rejects.toThrow("Команда 'unknown' не найдена");
	});
});
