import { describe, expect, test } from "bun:test";
import { Role } from "../../domain/user/roles";
import type { User } from "../../domain/user/user";
import { InMemoryUserRepository } from "../user-repository-inmemory";
import { GetUserByTelegramIdUc } from "./get-user-by-telegram-id-uc";

describe("GetUserByTelegramIdUc", () => {
  test("возвращает пользователя по telegramId", async () => {
    const repo = new InMemoryUserRepository();
    const user: User = {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      name: "Иван",
      telegramId: 12345,
      roles: [Role.ADMIN],
      createdAt: "2026-05-01T12:00",
    };
    await repo.save(user);

    const uc = new GetUserByTelegramIdUc();
    uc.init({ userRepo: repo });

    const result = await uc.handle({ telegramId: 12345 });
    expect(result).toEqual(user);
  });

  test("выбрасывает при несуществующем telegramId", async () => {
    const repo = new InMemoryUserRepository();
    const uc = new GetUserByTelegramIdUc();
    uc.init({ userRepo: repo });

    await expect(uc.handle({ telegramId: 99999 })).rejects.toThrow(
      "Пользователь не найден",
    );
  });
});
