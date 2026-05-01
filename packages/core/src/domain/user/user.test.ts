import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { UserSchema, type User } from "./user";
import { Role } from "./roles";

describe("Схема пользователя (User)", () => {
  // Валидный пользователь для переиспользования в тестах
  const validUser: User = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Иван Петров",
    telegramId: 123456789,
    role: Role.STUDENT,
  };

  test("должна принимать валидного пользователя со всеми полями", () => {
    const result = v.safeParse(UserSchema, validUser);
    expect(result.success).toBe(true);
  });

  test("должна принимать пользователя с ролью MENTOR", () => {
    const result = v.safeParse(UserSchema, {
      ...validUser,
      role: Role.MENTOR,
    });
    expect(result.success).toBe(true);
  });

  test("должна принимать пользователя с ролью ADMIN", () => {
    const result = v.safeParse(UserSchema, {
      ...validUser,
      role: Role.ADMIN,
    });
    expect(result.success).toBe(true);
  });

  describe("Валидация ID", () => {
    test("должна отклонять пользователя без ID", () => {
      const { id, ...withoutId } = validUser;
      const result = v.safeParse(UserSchema, withoutId);
      expect(result.success).toBe(false);
    });

    test("должна отклонять пользователя с пустым ID", () => {
      const result = v.safeParse(UserSchema, { ...validUser, id: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация telegramId", () => {
    test("должна отклонять пользователя без telegramId", () => {
      const { telegramId, ...withoutTg } = validUser;
      const result = v.safeParse(UserSchema, withoutTg);
      expect(result.success).toBe(false);
    });

    test("должна отклонять нецелый telegramId", () => {
      const result = v.safeParse(UserSchema, {
        ...validUser,
        telegramId: 123.45,
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять нулевой telegramId", () => {
      const result = v.safeParse(UserSchema, {
        ...validUser,
        telegramId: 0,
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять отрицательный telegramId", () => {
      const result = v.safeParse(UserSchema, {
        ...validUser,
        telegramId: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация роли", () => {
    test("должна отклонять пользователя без роли", () => {
      const { role, ...withoutRole } = validUser;
      const result = v.safeParse(UserSchema, withoutRole);
      expect(result.success).toBe(false);
    });

    test("должна отклонять невалидную роль", () => {
      const result = v.safeParse(UserSchema, {
        ...validUser,
        role: "SUPERHERO" as Role,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация имени", () => {
    test("должна отклонять пользователя без имени", () => {
      const { name, ...withoutName } = validUser;
      const result = v.safeParse(UserSchema, withoutName);
      expect(result.success).toBe(false);
    });
  });
});
