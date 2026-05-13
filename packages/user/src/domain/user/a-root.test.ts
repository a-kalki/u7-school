import { describe, expect, test } from "bun:test";
import { UserAr } from "./a-root";
import { Role } from "./roles";

const validUser = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	name: "Иван",
	telegramId: 123,
	roles: [Role.ADMIN],
	createdAt: "2026-05-01T12:00",
};

describe("UserAr", () => {
	describe("constructor", () => {
		test("создаётся из существующего состояния", () => {
			const ar = new UserAr(validUser);
			expect(ar.state).toEqual(validUser);
		});

		test("нарушение инвариантов выбрасывает ошибку", () => {
			expect(() => new UserAr({ ...validUser, name: "" })).toThrow(
				"Нарушены инварианты агрегата",
			);
		});

		test("нарушение инвариантов с несколькими ошибками", () => {
			const invalid = {
				...validUser,
				uuid: "bad",
				name: "",
				telegramId: -5,
				roles: [],
			};
			expect(() => new UserAr(invalid)).toThrow("Нарушены инварианты агрегата");
		});
	});

	describe("create", () => {
		test("генерирует UUID и createdAt", () => {
			const ar = UserAr.create({
				name: "А",
				telegramId: 1,
				roles: [Role.STUDENT],
			});
			expect(ar.state.uuid).toBeString();
			expect(ar.state.uuid).toMatch(
				/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
			);
			expect(ar.state.createdAt).toBeString();
			expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
		});

		test("сохраняет переданные поля", () => {
			const ar = UserAr.create({
				name: "Петр",
				telegramId: 456,
				roles: [Role.MENTOR, Role.ADMIN],
			});
			expect(ar.state.name).toBe("Петр");
			expect(ar.state.telegramId).toBe(456);
			expect(ar.state.roles).toEqual([Role.MENTOR, Role.ADMIN]);
		});

		test("не создаёт updatedAt при создании", () => {
			const ar = UserAr.create({
				name: "А",
				telegramId: 1,
				roles: [Role.STUDENT],
			});
			expect(ar.state.updatedAt).toBeUndefined();
		});
	});
});
