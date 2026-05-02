import { describe, expect, test } from "bun:test";
import type { CreateUserCommand } from "../commands/create_user_command";
import { Role } from "../../domain/user/roles";
import type { User } from "../../domain/user/user";
import { InMemoryUserRepository } from "./user_repository";
import { UserCreatingUc } from "./user_creating_uc";

/** Фикстуры */
const adminCmd: CreateUserCommand = {
	name: "Админ",
	telegramId: 1,
	role: Role.ADMIN,
};

const studentCmd: CreateUserCommand = {
	name: "Студент",
	telegramId: 2,
	role: Role.STUDENT,
};

describe("UserCreatingUc", () => {
	const repo = new InMemoryUserRepository();

	test("успешное создание первого пользователя в bootstrap-режиме (без актора)", () => {
		const uc = new UserCreatingUc(repo);
		const result = uc.execute(adminCmd);
		expect(result.name).toBe("Админ");
		expect(result.role).toBe(Role.ADMIN);
		expect(repo.isEmpty()).toBe(false);
	});

	test("bootstrap-режим: первый пользователь создаётся даже STUDENT без актора", () => {
		const emptyRepo = new InMemoryUserRepository();
		const uc = new UserCreatingUc(emptyRepo);
		const result = uc.execute({ name: "Бут", telegramId: 99, role: Role.STUDENT });
		expect(result.role).toBe(Role.STUDENT);
	});

	test("после bootstrap: STUDENT не может создать пользователя (недостаточно прав)", () => {
		const uc = new UserCreatingUc(repo);
		const studentActor: User = {
			uuid: "uuid-student",
			name: "Студент",
			telegramId: 2,
			role: Role.STUDENT,
			createdAt: "2026-05-01T12:00",
		};
		expect(() => uc.execute(studentCmd, studentActor)).toThrow();
	});

	test("после bootstrap: ADMIN может создать пользователя", () => {
		const uc = new UserCreatingUc(repo);
		const adminActor: User = {
			uuid: "uuid-admin",
			name: "Админ",
			telegramId: 1,
			role: Role.ADMIN,
			createdAt: "2026-05-01T12:00",
		};
		const result = uc.execute(
			{ name: "Новый", telegramId: 3, role: Role.MENTOR },
			adminActor,
		);
		expect(result.name).toBe("Новый");
	});

	test("дубликат telegramId — ошибка", () => {
		const freshRepo = new InMemoryUserRepository();
		const uc = new UserCreatingUc(freshRepo);
		uc.execute(adminCmd);
		expect(() => uc.execute(adminCmd)).toThrow();
	});
});
