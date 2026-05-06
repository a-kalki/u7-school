import { describe, expect, test } from "bun:test";
import { Role } from "@u7/user";
import type { User, CreateUserCmd } from "@u7/user";
import { UserCreatingUc } from "./user-creating-uc";
import { InMemoryUserRepository } from "./user-repository";

/** Хелпер: добавляет пользователя в репо и возвращает его uuid */
async function addUser(
	repo: InMemoryUserRepository,
	overrides: Partial<User> = {},
): Promise<string> {
	const user: User = {
		uuid: overrides.uuid ?? crypto.randomUUID(),
		name: overrides.name ?? "Тест",
		telegramId: overrides.telegramId ?? Math.floor(Math.random() * 100000),
		roles: overrides.roles ?? [Role.ADMIN],
		createdAt: overrides.createdAt ?? "2026-05-01T12:00",
	};
	await repo.save(user);
	return user.uuid;
}

const adminCmd: CreateUserCmd = {
	name: "Админ",
	telegramId: 1,
	roles: [Role.ADMIN],
};
const studentCmd: CreateUserCmd = {
	name: "Студент",
	telegramId: 2,
	roles: [Role.STUDENT],
};

describe("UserCreatingUc", () => {
	test("bootstrap: создаёт первого ADMIN без actorId", async () => {
		const uc = new UserCreatingUc(new InMemoryUserRepository());
		const user = await uc.execute(adminCmd);
		expect(user.roles).toEqual([Role.ADMIN]);
	});

	test("bootstrap: отклоняет STUDENT — первый пользователь должен быть ADMIN", async () => {
		const uc = new UserCreatingUc(new InMemoryUserRepository());
		expect(uc.execute(studentCmd)).rejects.toThrow(
			"Первый пользователь должен быть администратором",
		);
	});

	test("ADMIN создаёт пользователя", async () => {
		const repo = new InMemoryUserRepository();
		const adminId = await addUser(repo, {
			roles: [Role.ADMIN],
			telegramId: 100,
		});
		const uc = new UserCreatingUc(repo);
		const user = await uc.execute(
			{ name: "Новый", telegramId: 200, roles: [Role.MENTOR] },
			adminId,
		);
		expect(user.roles).toEqual([Role.MENTOR]);
	});

	test("ADMIN создаёт пользователя с несколькими ролями", async () => {
		const repo = new InMemoryUserRepository();
		const adminId = await addUser(repo, {
			roles: [Role.ADMIN],
			telegramId: 100,
		});
		const uc = new UserCreatingUc(repo);
		const user = await uc.execute(
			{ name: "Мульти", telegramId: 201, roles: [Role.STUDENT, Role.MENTOR] },
			adminId,
		);
		expect(user.roles).toEqual([Role.STUDENT, Role.MENTOR]);
	});

	test("STUDENT не может создавать — AccessDenied", async () => {
		const repo = new InMemoryUserRepository();
		const studentId = await addUser(repo, {
			roles: [Role.STUDENT],
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
		await addUser(repo, { telegramId: 777, roles: [Role.ADMIN] });
		const adminId = await addUser(repo, {
			telegramId: 778,
			roles: [Role.ADMIN],
		});
		const uc = new UserCreatingUc(repo);
		expect(
			uc.execute(
				{ name: "Дубль", telegramId: 777, roles: [Role.MENTOR] },
				adminId,
			),
		).rejects.toThrow("Пользователь с таким telegramId уже существует");
	});

	test("отклоняет создание с пустым массивом ролей", async () => {
		const repo = new InMemoryUserRepository();
		const adminId = await addUser(repo, {
			roles: [Role.ADMIN],
			telegramId: 500,
		});
		const uc = new UserCreatingUc(repo);
		expect(
			uc.execute({ name: "Пусто", telegramId: 501, roles: [] }, adminId),
		).rejects.toThrow("Некорректная команда создания пользователя");
	});
});
