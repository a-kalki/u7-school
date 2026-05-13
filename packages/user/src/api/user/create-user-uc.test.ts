import { describe, expect, mock, test } from "bun:test";
import type { User } from "#domain/user/entity";
import type { UserRepo } from "#domain/user/repo";
import { Role } from "#domain/user/roles";
import { CreateUserUc } from "./create-user-uc";

/**
 * Хелпер: создаёт мок-репозиторий и usecase.
 * Моки лежат в переменных, через них настраивается поведение в каждом тесте.
 */
function setupUc() {
	const save = mock(async (_user: User): Promise<void> => {});
	const getByUuid = mock(
		async (_uuid: string): Promise<User | undefined> => undefined,
	);
	const getByTelegramId = mock(
		async (_id: number): Promise<User | undefined> => undefined,
	);
	const getAll = mock(async (): Promise<User[]> => []);
	const isTelegramIdTaken = mock(
		async (_id: number): Promise<boolean> => false,
	);
	const isEmpty = mock(async (): Promise<boolean> => true);

	const repo: UserRepo = {
		save,
		getByUuid,
		getByTelegramId,
		getAll,
		isTelegramIdTaken,
		isEmpty,
	};
	const uc = new CreateUserUc();
	uc.init({ userRepo: repo });

	return {
		save,
		getByUuid,
		getByTelegramId,
		getAll,
		isTelegramIdTaken,
		isEmpty,
		repo,
		uc,
	};
}

function makeUser(overrides: Partial<User> = {}): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Тест",
		telegramId: 1,
		roles: [Role.ADMIN],
		createdAt: "2026-05-01T12:00",
		...overrides,
	};
}

describe("CreateUserUc", () => {
	describe("SUCCESS", () => {
		test("пользователь сохраняет переданные роли", async () => {
			const { getByUuid, uc } = setupUc();
			const admin = makeUser();

			getByUuid.mockResolvedValueOnce(admin);
			const user = await uc.handle(
				{ name: "Студент", telegramId: 2, roles: [Role.STUDENT] },
				admin.uuid,
			);

			expect(user.roles).toEqual([Role.STUDENT]);
		});

		test("ADMIN может создавать других пользователей", async () => {
			const { getByUuid, save, uc } = setupUc();
			const admin = makeUser();

			getByUuid.mockResolvedValueOnce(admin);

			const user = await uc.handle(
				{ name: "Новый студент", telegramId: 2, roles: [Role.STUDENT] },
				admin.uuid,
			);

			expect(user.roles).toEqual([Role.STUDENT]);
			expect(user.name).toBe("Новый студент");
			expect(save).toHaveBeenCalledTimes(1);
		});
	});

	describe("FAIL", () => {
		test("отклоняет дубликат telegramId", async () => {
			const { getByUuid, isTelegramIdTaken, uc } = setupUc();
			const admin = makeUser();

			getByUuid.mockResolvedValueOnce(admin);
			isTelegramIdTaken.mockResolvedValueOnce(true);

			await expect(
				uc.handle(
					{ name: "Б", telegramId: 1, roles: [Role.STUDENT] },
					admin.uuid,
				),
			).rejects.toThrow("Пользователь с таким telegramId уже существует");
		});

		test("отклоняет невалидную команду", async () => {
			const { getByUuid, uc } = setupUc();
			const admin = makeUser();

			getByUuid.mockResolvedValueOnce(admin);

			await expect(
				uc.handle({ name: "", telegramId: -1, roles: [] }, admin.uuid),
			).rejects.toThrow("Переданы некорректные данные");
		});

		test("отклоняет создание без авторизации", async () => {
			const { uc } = setupUc();

			await expect(
				uc.handle({ name: "Хакер", telegramId: 2, roles: [Role.ADMIN] }),
			).rejects.toThrow("Требуется авторизация");
		});

		test("отклоняет создание пользователем без прав ADMIN", async () => {
			const { getByUuid, uc } = setupUc();
			const student = makeUser({ roles: [Role.STUDENT], telegramId: 2 });

			getByUuid.mockResolvedValueOnce(student);

			await expect(
				uc.handle(
					{ name: "Хакер", telegramId: 3, roles: [Role.ADMIN] },
					student.uuid,
				),
			).rejects.toThrow("Недостаточно прав для создания пользователя");
		});
	});
});
