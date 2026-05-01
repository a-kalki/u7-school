import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { ModuleSchema, type Module } from "./module";

describe("Схема модуля (Module) — содержит проекты", () => {
  const validModule: Module = {
    id: "mod-001",
    title: "Модуль с проектами",
    goal: "Научиться создавать проекты",
    result: "Студент создаст 3 проекта",
    additional: "Дополнительные материалы",
    projects: [
      { id: "proj-1", title: "Проект 1" },
      { id: "proj-2", title: "Проект 2" },
    ],
  };

  test("должна принимать валидный модуль с проектами", () => {
    const result = v.safeParse(ModuleSchema, validModule);
    expect(result.success).toBe(true);
  });

  test("должна принимать модуль без необязательных полей", () => {
    const minimal: Module = {
      id: "mod-min",
      title: "Минимальный модуль",
      projects: [{ id: "p1", title: "P1" }],
    };
    const result = v.safeParse(ModuleSchema, minimal);
    expect(result.success).toBe(true);
  });

  describe("Валидация обязательных полей", () => {
    test("должна отклонять модуль без названия", () => {
      const result = v.safeParse(ModuleSchema, {
        ...validModule,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять модуль без проектов", () => {
      const { projects, ...rest } = validModule;
      const result = v.safeParse(ModuleSchema, rest);
      expect(result.success).toBe(false);
    });

    test("должна отклонять модуль с пустым массивом проектов", () => {
      const result = v.safeParse(ModuleSchema, {
        ...validModule,
        projects: [],
      });
      expect(result.success).toBe(false);
    });
  });
});
