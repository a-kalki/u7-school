import { describe, expect, test } from "bun:test";
import { Role } from "../../domain/user/roles";
import { InMemoryUserRepository } from "../user-repository-inmemory";
import { CreateUserUc } from "./create-user-uc";

describe("CreateUserUc", () => {
  test("создаёт первого пользователя как ADMIN (бутстрап)", async () => {
    const repo = new InMemoryUserRepository();
    const uc = new CreateUserUc();
    uc.init({ userRepo: repo });

    const user = await uc.handle({
      name: "Админ",
      telegramId: 1,
      roles: [Role.STUDENT],
    });
    expect(user.roles).toEqual([Role.ADMIN]);
    expect(user.name).toBe("Админ");
  });

  test("второй пользователь сохраняет переданные роли", async () => {
    const repo = new InMemoryUserRepository();
    const uc = new CreateUserUc();
    uc.init({ userRepo: repo });

    // Первый — bootstrap ADMIN
    await uc.handle({ name: "Админ", telegramId: 1, roles: [Role.ADMIN] });

    // Второй — сохраняет свои роли
    const user = await uc.handle({
      name: "Студент",
      telegramId: 2,
      roles: [Role.STUDENT],
    });
    expect(user.roles).toEqual([Role.STUDENT]);
  });

  test("отклоняет дубликат telegramId", async () => {
    const repo = new InMemoryUserRepository();
    const uc = new CreateUserUc();
    uc.init({ userRepo: repo });

    await uc.handle({ name: "А", telegramId: 1, roles: [Role.ADMIN] });

    await expect(
      uc.handle({ name: "Б", telegramId: 1, roles: [Role.STUDENT] }),
    ).rejects.toThrow("Пользователь с таким telegramId уже существует");
  });

  test("отклоняет невалидную команду", async () => {
    const repo = new InMemoryUserRepository();
    const uc = new CreateUserUc();
    uc.init({ userRepo: repo });

    await expect(
      uc.handle({ name: "", telegramId: -1, roles: [] }),
    ).rejects.toThrow("Переданы некорректные данные");
  });
});
