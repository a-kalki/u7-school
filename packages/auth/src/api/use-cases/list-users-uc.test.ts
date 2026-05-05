import { describe, expect, test } from "bun:test";
import { Role } from "../../domain/user/roles";
import type { User } from "../../domain/user/user";
import { InMemoryUserRepository } from "../user-repository-inmemory";
import { ListUsersUc } from "./list-users-uc";

describe("ListUsersUc", () => {
	test("возвращает пустой список для пустого репозитория", async () => {
		const repo = new InMemoryUserRepository();
		const uc = new ListUsersUc();
		uc.init({ userRepo: repo });

		const result = await uc.handle({});
		expect(result).toEqual([]);
	});

	test("возвращает всех пользователей", async () => {
		const repo = new InMemoryUserRepository();
		const user1: User = {
			uuid: "550e8400-e29b-41d4-a716-446655440000",
			name: "Иван",
			telegramId: 1,
			roles: [Role.ADMIN],
			createdAt: "2026-05-01T12:00",
		};
		const user2: User = {
			uuid: "550e8400-e29b-41d4-a716-446655440001",
			name: "Мария",
			telegramId: 2,
			roles: [Role.STUDENT],
			createdAt: "2026-05-01T12:00",
		};
		await repo.save(user1);
		await repo.save(user2);

		const uc = new ListUsersUc();
		uc.init({ userRepo: repo });

		const result = await uc.handle({});
		expect(result).toHaveLength(2);
		expect(result.map((u) => u.name)).toContain("Иван");
		expect(result.map((u) => u.name)).toContain("Мария");
	});
});
