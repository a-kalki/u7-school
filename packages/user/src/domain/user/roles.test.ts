import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Role, RoleSchema } from "./roles";

describe("Роли пользователей (Roles)", () => {
	test("должны быть определены роли STUDENT, MENTOR, ADMIN", () => {
		expect(Role.STUDENT as string).toBe("STUDENT");
		expect(Role.MENTOR as string).toBe("MENTOR");
		expect(Role.ADMIN as string).toBe("ADMIN");
	});

	test("RoleSchema должна пропускать валидные значения ролей", () => {
		expect(v.safeParse(RoleSchema, Role.STUDENT).success).toBe(true);
		expect(v.safeParse(RoleSchema, Role.MENTOR).success).toBe(true);
		expect(v.safeParse(RoleSchema, Role.ADMIN).success).toBe(true);
	});

	test("RoleSchema должна отклонять невалидные значения", () => {
		expect(v.safeParse(RoleSchema, "GUEST").success).toBe(false);
		expect(v.safeParse(RoleSchema, "SUPER_ADMIN").success).toBe(false);
		expect(v.safeParse(RoleSchema, "").success).toBe(false);
	});
});
