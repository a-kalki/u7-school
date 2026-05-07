import { describe, expect, mock, test } from "bun:test";
import type { User } from "../../domain/user/entity";
import type { UserRepo } from "../../domain/user/repo";
import { Role } from "../../domain/user/roles";
import { GetUserByTelegramIdUc } from "./get-user-by-telegram-id-uc";

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
  const uc = new GetUserByTelegramIdUc();
  uc.init({ userRepo: repo });

  return { getByTelegramId, uc };
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

describe("GetUserByTelegramIdUc", () => {
  test("возвращает пользователя по telegramId", async () => {
    const { getByTelegramId, uc } = setupUc();
    const user = makeUser({
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      name: "Иван",
      telegramId: 12345,
    });
    getByTelegramId.mockResolvedValueOnce(user);

    const result = await uc.handle({ telegramId: 12345 });

    expect(result).toEqual(user);
    expect(getByTelegramId).toHaveBeenCalledWith(12345);
  });

  test("выбрасывает при несуществующем telegramId", async () => {
    const { getByTelegramId, uc } = setupUc();
    getByTelegramId.mockResolvedValueOnce(undefined);

    await expect(uc.handle({ telegramId: 99999 })).rejects.toThrow(
      "Пользователь не найден",
    );
  });
});
