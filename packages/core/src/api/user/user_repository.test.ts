import { describe, expect, test } from "bun:test";
import { Role } from "../../domain/user/roles";
import type { User } from "../../domain/user/user";
import type { UserRepository } from "./user_repository";
import { InMemoryUserRepository } from "./user_repository";

/** Фикстура пользователя */
const testUser: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	name: "Тестовый",
	telegramId: 123,
	role: Role.ADMIN,
	createdAt: "2026-05-01T12:00",
};

describe("UserRepository (in-memory)", () => {
	let repo: UserRepository;

	test("сохранение и получение пользователя по uuid", () => {
		repo = new InMemoryUserRepository();
		repo.save(testUser);
		const found = repo.getByUuid(testUser.uuid);
		expect(found).toEqual(testUser);
	});

	test("получение несуществующего пользователя возвращает undefined", () => {
		repo = new InMemoryUserRepository();
		const found = repo.getByUuid("nonexistent-uuid");
		expect(found).toBeUndefined();
	});

	test("сохранение дубликата по uuid выбрасывает ошибку", () => {
		repo = new InMemoryUserRepository();
		repo.save(testUser);
		expect(() => repo.save(testUser)).toThrow();
	});

	test("получение пользователя по telegramId", () => {
		repo = new InMemoryUserRepository();
		repo.save(testUser);
		const found = repo.getByTelegramId(testUser.telegramId);
		expect(found).toEqual(testUser);
	});

	test("isTelegramIdTaken возвращает true для занятого id", () => {
		repo = new InMemoryUserRepository();
		repo.save(testUser);
		expect(repo.isTelegramIdTaken(testUser.telegramId)).toBe(true);
		expect(repo.isTelegramIdTaken(999)).toBe(false);
	});

	test("пустой репозиторий — isEmpty возвращает true", () => {
		repo = new InMemoryUserRepository();
		expect(repo.isEmpty()).toBe(true);
		repo.save(testUser);
		expect(repo.isEmpty()).toBe(false);
	});
});
