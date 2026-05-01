import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Role } from "../../domain/user/roles";
import {
	CreateUserCommandSchema,
	type CreateUserCommand,
} from "./create_user_command";

describe("CreateUserCommand (схема валидации)", () => {
	const validCommand: CreateUserCommand = {
		name: "Иван Петров",
		telegramId: 123456789,
		role: Role.ADMIN,
	};

	test("должна принимать валидную команду", () => {
		expect(v.safeParse(CreateUserCommandSchema, validCommand).success).toBe(
			true,
		);
	});

	test("должна принимать роль STUDENT", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, {
				...validCommand,
				role: Role.STUDENT,
			}).success,
		).toBe(true);
	});

	test("должна принимать роль MENTOR", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, {
				...validCommand,
				role: Role.MENTOR,
			}).success,
		).toBe(true);
	});

	test("должна отклонять пустое имя", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, { ...validCommand, name: "" })
				.success,
		).toBe(false);
	});

	test("должна отклонять невалидный telegramId", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, { ...validCommand, telegramId: -1 })
				.success,
		).toBe(false);
	});

	test("должна отклонять невалидную роль", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, {
				...validCommand,
				role: "UNKNOWN",
			}).success,
		).toBe(false);
	});
});
