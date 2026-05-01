import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import {
  ModuleSchema,
  type Module,
  type ModuleWithProjects,
  type ModuleWithLessons,
} from "./module";

describe("Схема модуля (Module) — исключающее ИЛИ", () => {
  // Валидный модуль с проектами
  const moduleWithProjects: ModuleWithProjects = {
    kind: "projects",
    id: "mod-001",
    title: "Модуль с проектами",
    goal: "Научиться создавать проекты",
    result: "Студент создаст 3 проекта",
    additional: "Дополнительные материалы",
    projects: [{ id: "proj-1", title: "Проект 1" }],
  };

  // Валидный модуль с уроками
  const moduleWithLessons: ModuleWithLessons = {
    kind: "lessons",
    id: "mod-002",
    title: "Модуль с уроками",
    goal: "Изучить основы",
    result: "Студент пройдёт все уроки",
    additional: "Рекомендации",
    lessons: [{ id: "les-1", title: "Урок 1" }],
  };

  test("должна принимать модуль с проектами", () => {
    const result = v.safeParse(ModuleSchema, moduleWithProjects);
    expect(result.success).toBe(true);
  });

  test("должна принимать модуль с уроками", () => {
    const result = v.safeParse(ModuleSchema, moduleWithLessons);
    expect(result.success).toBe(true);
  });

  test("должна принимать модуль с проектами без необязательных полей", () => {
    const minimal: ModuleWithProjects = {
      kind: "projects",
      id: "mod-min",
      title: "Минимальный модуль",
      projects: [],
    };
    const result = v.safeParse(ModuleSchema, minimal);
    expect(result.success).toBe(true);
  });

  test("должна принимать модуль с уроками без необязательных полей", () => {
    const minimal: ModuleWithLessons = {
      kind: "lessons",
      id: "mod-min",
      title: "Минимальный модуль",
      lessons: [],
    };
    const result = v.safeParse(ModuleSchema, minimal);
    expect(result.success).toBe(true);
  });

  describe("Исключающее ИЛИ", () => {
    test("при kind=lessons и наличии обоих полей — валидируется как модуль с уроками (projects игнорируется)", () => {
      const result = v.safeParse(ModuleSchema, {
        ...moduleWithProjects,
        kind: "lessons",
        lessons: moduleWithLessons.lessons,
      });
      // Valibot выбирает вариант по дискриминатору kind, projects — лишнее поле, игнорируется
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.kind).toBe("lessons");
      }
    });

    test("должна отклонять модуль без projects и без lessons", () => {
      const result = v.safeParse(ModuleSchema, {
        kind: "projects",
        id: "mod-003",
        title: "Модуль без контента",
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять модуль с kind=projects но массивом lessons", () => {
      const result = v.safeParse(ModuleSchema, {
        kind: "projects",
        id: "mod-004",
        title: "Неверный модуль",
        lessons: [{ id: "l1", title: "Тест" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация обязательных полей", () => {
    test("должна отклонять модуль без kind", () => {
      const { kind, ...rest } = moduleWithProjects;
      const result = v.safeParse(ModuleSchema, rest);
      expect(result.success).toBe(false);
    });

    test("должна отклонять модуль без названия", () => {
      const result = v.safeParse(ModuleSchema, {
        ...moduleWithProjects,
        title: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
