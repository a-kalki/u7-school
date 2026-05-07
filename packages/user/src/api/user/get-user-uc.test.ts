import { describe, expect, mock, test } from "bun:test";
import type { User } from "../../domain/user/entity";
import type { UserRepo } from "../../domain/user/repo";
import { Role } from "../../domain/user/roles";
import { GetUserUc } from "./get-user-uc";

function setupUc() {
  const save = mock(async (): Promise<void> => { });
  const getByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );
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
  const uc = new GetUserUc();
  uc.init({ userRepo: repo });

  return { getByUuid, uc };
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

describe("GetUserUc", () => {
  test("возвращает пользователя по UUID", async () => {
    const { getByUuid, uc } = setupUc();
    const user = makeUser({
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      name: "Иван",
    });
    getByUuid.mockResolvedValueOnce(user);

    const result = await uc.handle({ uuid: user.uuid });

    expect(result).toEqual(user);
    expect(getByUuid).toHaveBeenCalledWith(user.uuid);
  });

  test("выбрасывает при несуществующем UUID", async () => {
    const { getByUuid, uc } = setupUc();
    getByUuid.mockResolvedValueOnce(undefined);

    await expect(
      uc.handle({ uuid: "550e8400-e29b-41d4-a716-446655440999" }),
    ).rejects.toThrow("Пользователь не найден");
  });
});
