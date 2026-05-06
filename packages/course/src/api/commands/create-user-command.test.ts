import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Role } from "@u7/user";
import {
	type CreateUserCommand,
	CreateUserCommandSchema,
} from "./create-user-command";

describe("CreateUserCommand (схема валидации)", () => {
	const validCommand: CreateUserCommand = {
		name: "Иван Петров",
		telegramId: 123456789,
		roles: [Role.ADMIN],
	};

	test("должна принимать валидную команду", () => {
		expect(v.safeParse(CreateUserCommandSchema, validCommand).success).toBe(
			true,
		);
	});

	test("должна принимать несколько ролей", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, {
				...validCommand,
				roles: [Role.STUDENT, Role.MENTOR],
			}).success,
		).toBe(true);
	});

	test("должна принимать роль STUDENT", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, {
				...validCommand,
				roles: [Role.STUDENT],
			}).success,
		).toBe(true);
	});

	test("должна принимать роль MENTOR", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, {
				...validCommand,
				roles: [Role.MENTOR],
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

	test("должна отклонять пустой массив ролей", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, {
				...validCommand,
				roles: [],
			}).success,
		).toBe(false);
	});

	test("должна отклонять невалидную роль в массиве", () => {
		expect(
			v.safeParse(CreateUserCommandSchema, {
				...validCommand,
				roles: ["UNKNOWN"],
			}).success,
		).toBe(false);
	});
});
