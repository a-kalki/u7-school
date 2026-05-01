import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import {
  CourseSchema,
  type CourseWithModules,
  type CourseWithProjects,
} from "./course";
import { Status } from "../shared/status";
import type { Module } from "../module/module";
import type { Project } from "../project/project";

describe("Схема курса (Course)", () => {
  const baseFields = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    title: "Основы TypeScript",
    description: "Курс для начинающих",
    authorId: "660e8400-e29b-41d4-a716-446655440001",
    status: Status.DRAFT,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
  };

  const sampleModule: Module = {
    uuid: "770e8400-e29b-41d4-a716-446655440002",
    title: "Модуль 1",
    status: Status.DRAFT,
    order: 1,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
    projects: [
      {
        uuid: "880e8400-e29b-41d4-a716-446655440003",
        title: "Проект 1",
        status: Status.DRAFT,
        order: 1,
        createdAt: "2026-05-01T12:00",
        updatedAt: "2026-05-01T12:00",
      },
    ],
  };

  const sampleProject: Project = {
    uuid: "990e8400-e29b-41d4-a716-446655440004",
    title: "Проект 1",
    status: Status.DRAFT,
    order: 1,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
  };

  const courseWithModules: CourseWithModules = {
    ...baseFields,
    kind: "modules",
    modules: [sampleModule],
  };

  const courseWithProjects: CourseWithProjects = {
    ...baseFields,
    kind: "projects",
    projects: [sampleProject],
  };

  test("должна принимать курс с модулями", () => {
    expect(v.safeParse(CourseSchema, courseWithModules).success).toBe(true);
  });

  test("должна принимать курс с проектами", () => {
    expect(v.safeParse(CourseSchema, courseWithProjects).success).toBe(true);
  });

  describe("Исключающее ИЛИ", () => {
    test("должна отклонять курс с kind=modules но пустым modules", () => {
      const result = v.safeParse(CourseSchema, {
        ...baseFields,
        kind: "modules",
        modules: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация UUID", () => {
    test("должна отклонять невалидный UUID", () => {
      const result = v.safeParse(CourseSchema, {
        ...courseWithModules,
        uuid: "bad-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Валидация статуса", () => {
    test("должна отклонять невалидный статус", () => {
      const result = v.safeParse(CourseSchema, {
        ...courseWithModules,
        status: "deleted",
      });
      expect(result.success).toBe(false);
    });
  });
});
