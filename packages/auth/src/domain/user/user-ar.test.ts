import { describe, expect, test } from "bun:test";
import { Role } from "./roles";
import type { User } from "./user";
import { UserAr } from "./user-ar";

const validUser: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	name: "Иван Петров",
	telegramId: 123456789,
	roles: [Role.ADMIN],
	createdAt: "2026-05-01T12:00",
};

describe("Агрегат пользователя (UserAr)", () => {
	test("должен создаваться из существующего User и отдавать состояние", () => {
		const ar = new UserAr(validUser);
		expect(ar.state).toEqual(validUser);
	});

	test("create должен создавать агрегат с корректным состоянием", () => {
		const ar = UserAr.create({
			name: "Мария",
			telegramId: 999,
			roles: [Role.MENTOR],
		});
		expect(ar.state.name).toBe("Мария");
		expect(ar.state.telegramId).toBe(999);
		expect(ar.state.roles).toEqual([Role.MENTOR]);
		expect(ar.state.uuid).toBeString();
		expect(ar.state.createdAt).toBeString();
	});

	test("create должен создавать агрегат с несколькими ролями", () => {
		const ar = UserAr.create({
			name: "Петя",
			telegramId: 123,
			roles: [Role.STUDENT, Role.MENTOR],
		});
		expect(ar.state.roles).toEqual([Role.STUDENT, Role.MENTOR]);
	});

	test("create должен генерировать уникальные UUID", () => {
		const ar1 = UserAr.create({
			name: "А",
			telegramId: 1,
			roles: [Role.STUDENT],
		});
		const ar2 = UserAr.create({
			name: "Б",
			telegramId: 2,
			roles: [Role.STUDENT],
		});
		expect(ar1.state.uuid).not.toBe(ar2.state.uuid);
	});

	test("инварианты проходят для валидного состояния", () => {
		expect(() => new UserAr(validUser)).not.toThrow();
	});

	test("инварианты выбрасывают при нарушении", () => {
		expect(() => new UserAr({ ...validUser, name: "" })).toThrow(
			"Нарушены инварианты агрегата",
		);
	});
});
