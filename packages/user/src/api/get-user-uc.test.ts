import { describe, expect, test } from "bun:test";
import { Role } from "../domain/user/roles";
import type { User } from "../domain/user/entity";
import { UserInmemoryRepo } from "../infra/db/user-inmemory-repo";
import { GetUserUc } from "./get-user-uc";

describe("GetUserUc", () => {
  test("возвращает пользователя по UUID", async () => {
    const repo = new UserInmemoryRepo();
    const user: User = {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      name: "Иван",
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: "2026-05-01T12:00",
    };
    await repo.save(user);

    const uc = new GetUserUc();
    uc.init({ userRepo: repo });

    const result = await uc.handle({ uuid: user.uuid });
    expect(result).toEqual(user);
  });

  test("выбрасывает при несуществующем UUID", async () => {
    const repo = new UserInmemoryRepo();
    const uc = new GetUserUc();
    uc.init({ userRepo: repo });

    await expect(
      uc.handle({ uuid: "550e8400-e29b-41d4-a716-446655440999" }),
    ).rejects.toThrow("Пользователь не найден");
  });
});
