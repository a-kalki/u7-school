import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { UserSchema, type User } from "./user";
import { Role } from "./roles";

describe("Схема пользователя (User)", () => {
  const validUser: User = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    name: "Иван Петров",
    telegramId: 123456789,
    role: Role.STUDENT,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
  };

  test("должна принимать валидного пользователя со всеми полями", () => {
    const result = v.safeParse(UserSchema, validUser);
    expect(result.success).toBe(true);
  });

  describe("Валидация UUID", () => {
    test("должна отклонять пользователя без uuid", () => {
      const { uuid, ...rest } = validUser;
      const result = v.safeParse(UserSchema, rest);
      expect(result.success).toBe(false);
    });

    test("должна отклонять невалидный UUID", () => {
      const result = v.safeParse(UserSchema, {
        ...validUser,
        uuid: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация telegramId", () => {
    test("должна отклонять нецелый telegramId", () => {
      const result = v.safeParse(UserSchema, {
        ...validUser,
        telegramId: 123.45,
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

  describe("Валидация дат", () => {
    test("должна отклонять невалидный формат createdAt", () => {
      const result = v.safeParse(UserSchema, {
        ...validUser,
        createdAt: "вчера",
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять невалидный формат updatedAt", () => {
      const result = v.safeParse(UserSchema, {
        ...validUser,
        updatedAt: "2026-13-01T12:00",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация роли", () => {
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
      const { name, ...rest } = validUser;
      const result = v.safeParse(UserSchema, rest);
      expect(result.success).toBe(false);
    });
  });
});
