import { describe, expect, mock, test } from "bun:test";
import type { User } from "#domain/user/entity";
import type { UserRepo } from "#domain/user/repo";
import { Role } from "#domain/user/roles";
import { AddRoleToUserUc } from "./add-role-to-user-uc";

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
	const uc = new AddRoleToUserUc();
	uc.init({ userRepo: repo });

	return { save, getByUuid, uc };
}

describe("AddRoleToUserUc", () => {
	describe("SUCCESS", () => {
		test("ADMIN добавляет роль существующему пользователю", async () => {
			const { getByUuid, save, uc } = setupUc();
			const admin = makeUser();
			const target = makeUser({ roles: [Role.STUDENT], telegramId: 2 });

			getByUuid.mockResolvedValueOnce(admin);
			getByUuid.mockResolvedValueOnce(target);

			const user = await uc.handle(
				{ userId: target.uuid, role: Role.MENTOR },
				admin.uuid,
			);

			expect(user.roles).toEqual([Role.STUDENT, Role.MENTOR]);
			expect(save).toHaveBeenCalledTimes(1);
		});

		test("не дублирует существующую роль", async () => {
			const { getByUuid, save, uc } = setupUc();
			const admin = makeUser();
			const target = makeUser({
				roles: [Role.STUDENT, Role.MENTOR],
				telegramId: 2,
			});

			getByUuid.mockResolvedValueOnce(admin);
			getByUuid.mockResolvedValueOnce(target);

			const user = await uc.handle(
				{ userId: target.uuid, role: Role.MENTOR },
				admin.uuid,
			);

			expect(user.roles).toEqual([Role.STUDENT, Role.MENTOR]);
			expect(save).toHaveBeenCalledTimes(1);
		});
	});

	describe("FAIL", () => {
		test("отклоняет при несуществующем пользователе", async () => {
			const { getByUuid, uc } = setupUc();
			const admin = makeUser();

			getByUuid.mockResolvedValueOnce(admin);
			getByUuid.mockResolvedValueOnce(undefined);

			await expect(
				uc.handle(
					{ userId: crypto.randomUUID(), role: Role.MENTOR },
					admin.uuid,
				),
			).rejects.toThrow("Пользователь не найден");
		});

		test("отклоняет при отсутствии прав ADMIN", async () => {
			const { getByUuid, uc } = setupUc();
			const student = makeUser({ roles: [Role.STUDENT], telegramId: 2 });
			const target = makeUser({ roles: [Role.STUDENT], telegramId: 3 });

			getByUuid.mockResolvedValueOnce(student);
			getByUuid.mockResolvedValueOnce(target);

			await expect(
				uc.handle({ userId: target.uuid, role: Role.MENTOR }, student.uuid),
			).rejects.toThrow("Недостаточно прав для выполнения действия");
		});

		test("отклоняет при отсутствии авторизации", async () => {
			const { uc } = setupUc();

			await expect(
				uc.handle({ userId: "any", role: Role.MENTOR }),
			).rejects.toThrow("Требуется авторизация");
		});

		test("отклоняет невалидную команду", async () => {
			const { getByUuid, uc } = setupUc();
			const admin = makeUser();

			getByUuid.mockResolvedValueOnce(admin);

			await expect(
				uc.handle({ userId: "bad", role: "UNKNOWN" as Role }, admin.uuid),
			).rejects.toThrow("Переданы некорректные данные");
		});
	});
});
