import { describe, expect, test } from "bun:test";
import { Role } from "@u7/user";
import type { User } from "@u7/user";
import { InMemoryUserRepository } from "./user-repository";

/** Фикстура пользователя */
const testUser: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	name: "Тестовый",
	telegramId: 123,
	roles: [Role.ADMIN],
	createdAt: "2026-05-01T12:00",
};

describe("UserRepository (in-memory)", () => {
	test("сохранение и получение пользователя по uuid", async () => {
		const repo = new InMemoryUserRepository();
		await repo.save(testUser);
		const found = await repo.getByUuid(testUser.uuid);
		expect(found).toEqual(testUser);
	});

	test("получение несуществующего пользователя возвращает undefined", async () => {
		const repo = new InMemoryUserRepository();
		const found = await repo.getByUuid("nonexistent-uuid");
		expect(found).toBeUndefined();
	});

	test("сохранение дубликата по uuid выбрасывает ошибку", async () => {
		const repo = new InMemoryUserRepository();
		await repo.save(testUser);
		await expect(repo.save(testUser)).rejects.toThrow();
	});

	test("получение пользователя по telegramId", async () => {
		const repo = new InMemoryUserRepository();
		await repo.save(testUser);
		const found = await repo.getByTelegramId(testUser.telegramId);
		expect(found).toEqual(testUser);
	});

	test("isTelegramIdTaken возвращает true для занятого id", async () => {
		const repo = new InMemoryUserRepository();
		await repo.save(testUser);
		expect(await repo.isTelegramIdTaken(testUser.telegramId)).toBe(true);
		expect(await repo.isTelegramIdTaken(999)).toBe(false);
	});

	test("пустой репозиторий — isEmpty возвращает true", async () => {
		const repo = new InMemoryUserRepository();
		expect(await repo.isEmpty()).toBe(true);
		await repo.save(testUser);
		expect(await repo.isEmpty()).toBe(false);
	});
});
