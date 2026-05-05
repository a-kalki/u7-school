import { describe, expect, test } from "bun:test";
import type { User } from "./user";
import { Role } from "./roles";
import { UserPolicy } from "./user-policy";

/** Фикстуры пользователей с разными ролями */
const admin: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	name: "Админ",
	telegramId: 1,
	roles: [Role.ADMIN],
	createdAt: "2026-05-01T12:00",
};

const mentor: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440001",
	name: "Ментор",
	telegramId: 2,
	roles: [Role.MENTOR],
	createdAt: "2026-05-01T12:00",
};

const student: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440002",
	name: "Студент",
	telegramId: 3,
	roles: [Role.STUDENT],
	createdAt: "2026-05-01T12:00",
};

const multiRole: User = {
	uuid: "550e8400-e29b-41d4-a716-446655440003",
	name: "Мульти",
	telegramId: 4,
	roles: [Role.STUDENT, Role.MENTOR],
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

		test("пользователь с ролью ADMIN среди нескольких может создавать", () => {
			const adminMentor: User = {
				...admin,
				roles: [Role.ADMIN, Role.MENTOR],
			};
			expect(UserPolicy.canCreate(adminMentor)).toBe(true);
		});
	});

	describe("canRead", () => {
		test("любой пользователь может читать профили", () => {
			expect(UserPolicy.canRead(admin)).toBe(true);
			expect(UserPolicy.canRead(mentor)).toBe(true);
			expect(UserPolicy.canRead(student)).toBe(true);
			expect(UserPolicy.canRead(multiRole)).toBe(true);
		});
	});

	describe("canEdit", () => {
		test("ADMIN может редактировать любого пользователя", () => {
			expect(UserPolicy.canEdit(admin, student)).toBe(true);
		});

		test("MENTOR не может редактировать чужой профиль", () => {
			expect(UserPolicy.canEdit(mentor, student)).toBe(false);
		});

		test("MENTOR может редактировать свой профиль", () => {
			expect(UserPolicy.canEdit(mentor, mentor)).toBe(true);
		});

		test("STUDENT не может редактировать чужой профиль", () => {
			expect(UserPolicy.canEdit(student, mentor)).toBe(false);
		});

		test("STUDENT может редактировать свой профиль", () => {
			expect(UserPolicy.canEdit(student, student)).toBe(true);
		});

		test("пользователь с ролью ADMIN среди нескольких может редактировать", () => {
			const adminMentor: User = {
				...admin,
				roles: [Role.ADMIN, Role.MENTOR],
			};
			expect(UserPolicy.canEdit(adminMentor, student)).toBe(true);
		});
	});
});
