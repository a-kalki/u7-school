import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { CourseSchema, type Course, type CourseWithModules, type CourseWithProjects } from "./course";
import type { Module } from "./module";
import type { Project } from "./project";

describe("Схема курса (Course) — исключающее ИЛИ (модули | проекты)", () => {
  const sampleModule: Module = {
    kind: "projects",
    id: "mod-001",
    title: "Модуль 1",
    projects: [{ id: "p1", title: "Проект 1" }],
  };

  const sampleProject: Project = {
    id: "proj-001",
    title: "Проект 1",
  };

  const baseMeta = {
    id: "course-001",
    title: "Основы TypeScript",
    description: "Курс для начинающих",
    authorId: "author-001",
  };

  const courseWithModules: CourseWithModules = {
    ...baseMeta,
    kind: "modules",
    modules: [sampleModule],
  };

  const courseWithProjects: CourseWithProjects = {
    ...baseMeta,
    kind: "projects",
    projects: [sampleProject],
  };

  test("должна принимать курс с модулями", () => {
    const result = v.safeParse(CourseSchema, courseWithModules);
    expect(result.success).toBe(true);
  });

  test("должна принимать курс с проектами", () => {
    const result = v.safeParse(CourseSchema, courseWithProjects);
    expect(result.success).toBe(true);
  });

  describe("Исключающее ИЛИ", () => {
    test("должна отклонять курс без kind", () => {
      const { kind, ...rest } = courseWithModules;
      const result = v.safeParse(CourseSchema, rest);
      expect(result.success).toBe(false);
    });

    test("должна отклонять курс без modules и без projects", () => {
      const result = v.safeParse(CourseSchema, {
        ...baseMeta,
        kind: "modules",
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять курс с kind=modules но пустым массивом modules", () => {
      const result = v.safeParse(CourseSchema, {
        ...baseMeta,
        kind: "modules",
        modules: [],
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять курс с kind=projects но массивом modules", () => {
      const result = v.safeParse(CourseSchema, {
        ...baseMeta,
        kind: "projects",
        modules: [sampleModule],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация обязательных полей", () => {
    test("должна отклонять курс без названия", () => {
      const result = v.safeParse(CourseSchema, {
        ...courseWithModules,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    test("должна отклонять курс без описания", () => {
      const { description, ...rest } = courseWithModules;
      const result = v.safeParse(CourseSchema, rest);
      expect(result.success).toBe(false);
    });

    test("должна отклонять курс без автора", () => {
      const { authorId, ...rest } = courseWithModules;
      const result = v.safeParse(CourseSchema, rest);
      expect(result.success).toBe(false);
    });
  });

  describe("Необязательные поля", () => {
    test("должна принимать курс с модулями без необязательных полей", () => {
      const result = v.safeParse(CourseSchema, {
        id: "c-min",
        title: "Мини-курс",
        description: "Минимум",
        authorId: "a1",
        kind: "modules",
        modules: [sampleModule],
      });
      expect(result.success).toBe(true);
    });
  });
});
