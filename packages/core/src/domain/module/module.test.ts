import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { ModuleSchema, type Module } from "./module";
import { Status } from "../shared/status";

describe("Схема модуля (Module)", () => {
  const validModule: Module = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    title: "Модуль с проектами",
    goal: "Научиться создавать проекты",
    result: "Студент создаст 3 проекта",
    additional: "Дополнительные материалы",
    status: Status.DRAFT,
    order: 1,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
    projects: [
      {
        uuid: "660e8400-e29b-41d4-a716-446655440001",
        title: "Проект 1",
        status: Status.DRAFT,
        order: 1,
        createdAt: "2026-05-01T12:00",
        updatedAt: "2026-05-01T12:00",
      },
    ],
  };

  test("должна принимать валидный модуль", () => {
    expect(v.safeParse(ModuleSchema, validModule).success).toBe(true);
  });

  test("должна принимать модуль без необязательных полей", () => {
    const minimal: Module = {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      title: "Минимум",
      status: Status.PUBLISHED,
      order: 0,
      createdAt: "2026-05-01T12:00",
      updatedAt: "2026-05-01T12:00",
      projects: [
        {
          uuid: "660e8400-e29b-41d4-a716-446655440001",
          title: "P1",
          status: Status.DRAFT,
          order: 0,
          createdAt: "2026-05-01T12:00",
          updatedAt: "2026-05-01T12:00",
        },
      ],
    };
    expect(v.safeParse(ModuleSchema, minimal).success).toBe(true);
  });

  test("должна отклонять модуль без проектов", () => {
    const { projects, ...rest } = validModule;
    expect(v.safeParse(ModuleSchema, rest).success).toBe(false);
  });

  test("должна отклонять модуль с пустым массивом проектов", () => {
    expect(
      v.safeParse(ModuleSchema, { ...validModule, projects: [] }).success,
    ).toBe(false);
  });

  test("должна отклонять невалидный статус", () => {
    expect(
      v.safeParse(ModuleSchema, { ...validModule, status: "deleted" }).success,
    ).toBe(false);
  });

  test("должна отклонять невалидный UUID", () => {
    expect(
      v.safeParse(ModuleSchema, { ...validModule, uuid: "bad" }).success,
    ).toBe(false);
  });

  test("должна отклонять отрицательный order", () => {
    expect(
      v.safeParse(ModuleSchema, { ...validModule, order: -1 }).success,
    ).toBe(false);
  });
});
