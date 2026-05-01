import { describe, expect, test } from "bun:test";
import { DomainException } from "../shared/exceptions";
import type { User } from "./user";
import { UserAr } from "./user_ar";
import { Role } from "./roles";

/** Фикстура валидного пользователя */
const validUser: User = {
  uuid: "550e8400-e29b-41d4-a716-446655440000",
  name: "Иван Петров",
  telegramId: 123456789,
  role: "ADMIN",
  createdAt: "2026-05-01T12:00",
};

describe("Агрегат пользователя (UserAr)", () => {
  test("должен создаваться из существующего User и отдавать состояние", () => {
    const ar = new UserAr(validUser);
    expect(ar.state).toEqual(validUser);
  });

  test("состояние агрегата иммутабельно через геттер", () => {
    const ar = new UserAr(validUser);
    const state = ar.state;
    // @ts-expect-error
    state.name = "Хакер";
    expect(ar.state.name).toBe("Иван Петров");
  });

  test("create должен создавать агрегат с корректным состоянием", () => {
    const ar = UserAr.create({
      name: "Мария",
      telegramId: 999,
      role: Role.MENTOR,
    });

    expect(ar.state.name).toBe("Мария");
    expect(ar.state.telegramId).toBe(999);
    expect(ar.state.role).toBe("MENTOR");
    expect(ar.state.uuid).toBeString();
    expect(ar.state.createdAt).toBeString();
  });

  test("create должен генерировать уникальные UUID для разных пользователей", () => {
    const ar1 = UserAr.create({
      name: "А",
      telegramId: 1,
      role: Role.STUDENT,
    });
    const ar2 = UserAr.create({
      name: "Б",
      telegramId: 2,
      role: Role.STUDENT,
    });
    expect(ar1.state.uuid).not.toBe(ar2.state.uuid);
  });

  test("validateInvariants должен проходить для валидного состояния", () => {
    expect(() => new UserAr(validUser)).not.toThrow();
  });

  test("validateInvariants должен выбрасывать DomainException при нарушении инвариантов", () => {
    const ar = new UserAr(validUser);
    // Мутируем приватное состояние через создание некорректного пользователя
    expect(() => new UserAr({ ...validUser, name: "" })).toThrow(
      DomainException,
    );
  });

  test("create должен выбрасывать DomainException при невалидной команде", () => {
    expect(() =>
      UserAr.create({ name: "", telegramId: 1, role: Role.ADMIN }),
    ).toThrow(DomainException);
  });
});
