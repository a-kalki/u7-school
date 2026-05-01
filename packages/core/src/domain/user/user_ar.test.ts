import { describe, expect, test } from "bun:test";
import { Role } from "./roles";
import type { User } from "./user";
import { UserAr } from "./user_ar";

/** Фикстура валидного пользователя */
const validUser: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	name: "Иван Петров",
	telegramId: 123456789,
	role: Role.ADMIN,
	createdAt: "2026-05-01T12:00:00.000Z",
};

describe("Агрегат пользователя (UserAr)", () => {
	test("должен создаваться из существующего User и отдавать состояние", () => {
		const ar = new UserAr(validUser);
		expect(ar.state).toEqual(validUser);
	});

	test("должен создаваться фабричным методом create из валидной команды", () => {
		const command = {
			name: "Иван Петров",
			telegramId: 123456789,
			role: Role.ADMIN,
		};
		const ar = UserAr.create(command);
		expect(ar.state.name).toBe("Иван Петров");
		expect(ar.state.telegramId).toBe(123456789);
		expect(ar.state.role).toBe(Role.ADMIN);
		expect(ar.state.uuid).toBeString();
	});

	test("create должен выбрасывать DomainException при пустом имени", () => {
		const command = {
			name: "",
			telegramId: 123456789,
			role: Role.ADMIN,
		};
		expect(() => UserAr.create(command)).toThrow();
	});

	test("create должен выбрасывать DomainException при невалидном telegramId", () => {
		const command = {
			name: "Иван",
			telegramId: -1,
			role: Role.ADMIN,
		};
		expect(() => UserAr.create(command)).toThrow();
	});

	test("create должен выбрасывать DomainException при невалидной роли", () => {
		const command = {
			name: "Иван",
			telegramId: 123456789,
			role: "SUPERHERO",
		};
		expect(() => UserAr.create(command)).toThrow();
	});

	test("состояние агрегата доступно только для чтения через геттер", () => {
		const ar = new UserAr(validUser);
		const state = ar.state;
		// Попытка мутации полученного объекта не должна влиять на агрегат
		state.name = "Хакер";
		expect(ar.state.name).toBe("Иван Петров");
	});
});
