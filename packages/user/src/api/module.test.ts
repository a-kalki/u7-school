import { describe, expect, test } from "bun:test";
import type { User } from "#domain/user/entity";
import { Role } from "#domain/user/roles";
import { UserInmemoryRepo } from "#infra/db/user-inmemory-repo";
import { UserApiModule } from "./module";

describe("UserApiModule", () => {
  test("user.create: бутстрап создаёт ADMIN", async () => {
    const mod = new UserApiModule();
    mod.init({ userRepo: new UserInmemoryRepo() });

    const result = await mod.handle({
      name: "create-user",
      attrs: { name: "А", telegramId: 1, roles: [Role.ADMIN] },
    });
    expect((result as User).roles).toEqual([Role.ADMIN]);
  });

  test("user.create: второй пользователь сохраняет роли", async () => {
    const repo = new UserInmemoryRepo();
    const mod = new UserApiModule();
    mod.init({ userRepo: repo });

    const admin = await mod.handle({
      name: "create-user",
      attrs: { name: "Админ", telegramId: 1, roles: [Role.ADMIN] },
    });
    const result = await mod.handle({
      name: "create-user",
      attrs: { name: "Студент", telegramId: 2, roles: [Role.STUDENT] },
      actorId: (admin as User).uuid,
    });
    expect((result as User).roles).toEqual([Role.STUDENT]);
  });

  test("user.get: возвращает пользователя", async () => {
    const repo = new UserInmemoryRepo();
    const user: User = {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      name: "Иван",
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: "2026-05-01T12:00",
    };
    await repo.save(user);

    const mod = new UserApiModule();
    mod.init({ userRepo: repo });

    const result = await mod.handle({
      name: "get-user",
      attrs: { uuid: user.uuid },
    });
    expect((result as User).name).toBe("Иван");
  });

  test("user.list: возвращает список", async () => {
    const repo = new UserInmemoryRepo();
    const user: User = {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      name: "Иван",
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: "2026-05-01T12:00",
    };
    await repo.save(user);

    const mod = new UserApiModule();
    mod.init({ userRepo: repo });

    const result = await mod.handle({
      name: "list-users",
      attrs: {},
    });
    expect(result as User[]).toHaveLength(1);
  });

  test("user.get-by-telegram-id: находит пользователя", async () => {
    const repo = new UserInmemoryRepo();
    const user: User = {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      name: "Иван",
      telegramId: 12345,
      roles: [Role.ADMIN],
      createdAt: "2026-05-01T12:00",
    };
    await repo.save(user);

    const mod = new UserApiModule();
    mod.init({ userRepo: repo });

    const result = await mod.handle({
      name: "get-user-by-telegram-id",
      attrs: { telegramId: 12345 },
    });
    expect((result as User).name).toBe("Иван");
  });

  test("неизвестная команда — ошибка", async () => {
    const mod = new UserApiModule();
    mod.init({ userRepo: new UserInmemoryRepo() });

    await expect(mod.handle({ name: "unknown", attrs: {} })).rejects.toThrow(
      "Команда 'unknown' не найдена",
    );
  });
});
