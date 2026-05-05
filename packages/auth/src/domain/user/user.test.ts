import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Role } from "./roles";
import { type User, UserSchema } from "./user";

describe("Схема пользователя (User)", () => {
	const validUser: User = {
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		name: "Иван Петров",
		telegramId: 123456789,
		roles: [Role.STUDENT],
		createdAt: "2026-05-01T12:00",
	};

	test("должна принимать валидного пользователя с одной ролью", () => {
		expect(v.safeParse(UserSchema, validUser).success).toBe(true);
	});

	test("должна принимать пользователя с несколькими ролями", () => {
		const multiRole = { ...validUser, roles: [Role.STUDENT, Role.MENTOR] };
		expect(v.safeParse(UserSchema, multiRole).success).toBe(true);
	});

	test("должна принимать пользователя с updatedAt", () => {
		expect(
			v.safeParse(UserSchema, { ...validUser, updatedAt: "2026-05-01T12:00" })
				.success,
		).toBe(true);
	});

	test("должна отклонять невалидный UUID", () => {
		expect(v.safeParse(UserSchema, { ...validUser, uuid: "bad" }).success).toBe(
			false,
		);
	});

	test("должна отклонять невалидный telegramId", () => {
		expect(
			v.safeParse(UserSchema, { ...validUser, telegramId: -1 }).success,
		).toBe(false);
	});

	test("должна отклонять пустой массив ролей", () => {
		expect(v.safeParse(UserSchema, { ...validUser, roles: [] }).success).toBe(
			false,
		);
	});

	test("должна отклонять невалидную роль в массиве", () => {
		expect(
			v.safeParse(UserSchema, {
				...validUser,
				roles: ["SUPERHERO"],
			}).success,
		).toBe(false);
	});
});
