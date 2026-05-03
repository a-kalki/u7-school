import { describe, expect, test } from "bun:test";
import { Role } from "../../domain/user/roles";
import type { User } from "../../domain/user/user";
import type { CreateUserCommand } from "../commands/create_user_command";
import { UserCreatingUc } from "./user_creating_uc";
import { InMemoryUserRepository } from "./user_repository";

/** Хелпер: добавляет пользователя в репо и возвращает его uuid */
async function addUser(
	repo: InMemoryUserRepository,
	overrides: Partial<User> = {},
): Promise<string> {
	const user: User = {
		uuid: overrides.uuid ?? crypto.randomUUID(),
		name: overrides.name ?? "Тест",
		telegramId: overrides.telegramId ?? Math.floor(Math.random() * 100000),
		role: overrides.role ?? Role.ADMIN,
		createdAt: overrides.createdAt ?? "2026-05-01T12:00",
	};
	await repo.save(user);
	return user.uuid;
}

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
	test("bootstrap: создаёт первого ADMIN без actorId", async () => {
		const uc = new UserCreatingUc(new InMemoryUserRepository());
		const user = await uc.execute(adminCmd);
		expect(user.role).toBe(Role.ADMIN);
	});

	test("bootstrap: отклоняет STUDENT — первый пользователь должен быть ADMIN", async () => {
		const uc = new UserCreatingUc(new InMemoryUserRepository());
		expect(uc.execute(studentCmd)).rejects.toThrow(
			"Первый пользователь должен быть администратором",
		);
	});

	test("ADMIN создаёт пользователя", async () => {
		const repo = new InMemoryUserRepository();
		const adminId = await addUser(repo, { role: Role.ADMIN, telegramId: 100 });
		const uc = new UserCreatingUc(repo);
		const user = await uc.execute(
			{ name: "Новый", telegramId: 200, role: Role.MENTOR },
			adminId,
		);
		expect(user.role).toBe(Role.MENTOR);
	});

	test("STUDENT не может создавать — AccessDenied", async () => {
		const repo = new InMemoryUserRepository();
		const studentId = await addUser(repo, {
			role: Role.STUDENT,
			telegramId: 300,
		});
		const uc = new UserCreatingUc(repo);
		expect(uc.execute(studentCmd, studentId)).rejects.toThrow(
			"Недостаточно прав для создания пользователя",
		);
	});

	test("несуществующий actorId — notFound", async () => {
		const uc = new UserCreatingUc(new InMemoryUserRepository());
		expect(uc.execute(adminCmd, "nonexistent")).rejects.toThrow(
			"Пользователь не найден",
		);
	});

	test("дубликат telegramId — conflict", async () => {
		const repo = new InMemoryUserRepository();
		await addUser(repo, { telegramId: 777, role: Role.ADMIN });
		const adminId = await addUser(repo, { telegramId: 778, role: Role.ADMIN });
		const uc = new UserCreatingUc(repo);
		expect(
			uc.execute(
				{ name: "Дубль", telegramId: 777, role: Role.MENTOR },
				adminId,
			),
		).rejects.toThrow("Пользователь с таким telegramId уже существует");
	});
});
