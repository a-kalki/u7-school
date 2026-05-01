import { describe, expect, test } from "bun:test";
import type { User } from "../user/user";
import { UserPolicy } from "./user_policy";

/** Фикстуры пользователей с разными ролями */
const admin: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	name: "Админ",
	telegramId: 1,
	role: "ADMIN",
	createdAt: "2026-05-01T12:00",
};

const mentor: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440001",
	name: "Ментор",
	telegramId: 2,
	role: "MENTOR",
	createdAt: "2026-05-01T12:00",
};

const student: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440002",
	name: "Студент",
	telegramId: 3,
	role: "STUDENT",
	createdAt: "2026-05-01T12:00",
};

describe("UserPolicy", () => {
	describe("canCreate", () => {
		test("ADMIN может создавать пользователей", () => {
			expect(UserPolicy.canCreate(admin)).toBe(true);
		});

		test("MENTOR не может создавать пользователей", () => {
			expect(UserPolicy.canCreate(mentor)).toBe(false);
		});

		test("STUDENT не может создавать пользователей", () => {
			expect(UserPolicy.canCreate(student)).toBe(false);
		});
	});

	describe("canRead", () => {
		test("любой пользователь может читать профили", () => {
			expect(UserPolicy.canRead(admin)).toBe(true);
			expect(UserPolicy.canRead(mentor)).toBe(true);
			expect(UserPolicy.canRead(student)).toBe(true);
		});
	});

	describe("canEdit", () => {
		test("ADMIN может редактировать пользователей", () => {
			expect(UserPolicy.canEdit(admin)).toBe(true);
		});

		test("MENTOR не может редактировать пользователей", () => {
			expect(UserPolicy.canEdit(mentor)).toBe(false);
		});

		test("STUDENT не может редактировать пользователей", () => {
			expect(UserPolicy.canEdit(student)).toBe(false);
		});
	});
});
