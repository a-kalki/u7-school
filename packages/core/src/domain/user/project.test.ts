import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { ProjectSchema, type Project } from "./project";

describe("Схема проекта (Project) — содержит уроки", () => {
  const validProject: Project = {
    id: "proj-001",
    title: "Калькулятор на TypeScript",
    goal: "Создать полноценное консольное приложение-калькулятор",
    result: "Студент создаст работающий калькулятор с обработкой ошибок",
    additional: "Использовать паттерн Strategy для операций",
    lessons: [
      { id: "les-1", title: "Введение" },
      { id: "les-2", title: "Архитектура" },
    ],
  };

  test("должна принимать валидный проект со всеми полями", () => {
    const result = v.safeParse(ProjectSchema, validProject);
    expect(result.success).toBe(true);
  });

  test("должна принимать проект только с обязательными полями", () => {
    const minimal = {
      id: "proj-min",
      title: "Минимальный проект",
    };
    const result = v.safeParse(ProjectSchema, minimal);
    expect(result.success).toBe(true);
  });

  test("должна принимать проект без уроков", () => {
    const { lessons, ...rest } = validProject;
    const result = v.safeParse(ProjectSchema, rest);
    expect(result.success).toBe(true);
  });

  test("должна принимать проект с пустым массивом уроков", () => {
    const result = v.safeParse(ProjectSchema, {
      ...validProject,
      lessons: [],
    });
    expect(result.success).toBe(true);
  });

  describe("Валидация обязательных полей", () => {
    test("должна отклонять проект без названия", () => {
      const result = v.safeParse(ProjectSchema, {
        ...validProject,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять проект без ID", () => {
      const { id, ...rest } = validProject;
      const result = v.safeParse(ProjectSchema, rest);
      expect(result.success).toBe(false);
    });
  });
});
