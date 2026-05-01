import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { ProjectSchema, type Project } from "./project";

describe("Схема проекта (Project)", () => {
  const validProject: Project = {
    id: "proj-001",
    title: "Калькулятор на TypeScript",
    goal: "Создать полноценное консольное приложение-калькулятор",
    result: "Студент создаст работающий калькулятор с обработкой ошибок",
    additional: "Использовать паттерн Strategy для операций",
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

  test("должна принимать проект без goal, result, additional", () => {
    const { goal, result, additional, ...rest } = validProject;
    const res = v.safeParse(ProjectSchema, rest);
    expect(res.success).toBe(true);
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
