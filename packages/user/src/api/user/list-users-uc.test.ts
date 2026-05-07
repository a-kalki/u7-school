import { describe, expect, mock, test } from "bun:test";
import type { User } from "../../domain/user/entity";
import type { UserRepo } from "../../domain/user/repo";
import { Role } from "../../domain/user/roles";
import { ListUsersUc } from "./list-users-uc";

function setupUc() {
  const save = mock(async (): Promise<void> => { });
  const getByUuid = mock(async (): Promise<User | undefined> => undefined);
  const getByTelegramId = mock(
    async (): Promise<User | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<User[]> => []);
  const isTelegramIdTaken = mock(async (): Promise<boolean> => false);
  const isEmpty = mock(async (): Promise<boolean> => true);

  const repo: UserRepo = {
    save,
    getByUuid,
    getByTelegramId,
    getAll,
    isTelegramIdTaken,
    isEmpty,
  };
  const uc = new ListUsersUc();
  uc.init({ userRepo: repo });

  return { getAll, uc };
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

describe("ListUsersUc", () => {
  test("возвращает пустой список для пустого репозитория", async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    expect(await uc.handle({})).toEqual([]);
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  test("возвращает всех пользователей", async () => {
    const { getAll, uc } = setupUc();
    const u1 = makeUser({ name: "Иван" });
    const u2 = makeUser({
      name: "Мария",
      telegramId: 2,
      roles: [Role.STUDENT],
    });
    getAll.mockResolvedValueOnce([u1, u2]);

    const result = await uc.handle({});

    expect(result).toHaveLength(2);
    expect(result.map((u) => u.name)).toContain("Иван");
    expect(result.map((u) => u.name)).toContain("Мария");
    expect(getAll).toHaveBeenCalledTimes(1);
  });
});
