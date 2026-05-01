import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { ProjectSchema, type Project } from "./project";
import { Status } from "../shared/status";

describe("Схема проекта (Project)", () => {
  const validProject: Project = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    title: "Калькулятор на TypeScript",
    goal: "Создать консольное приложение-калькулятор",
    result: "Работающий калькулятор с обработкой ошибок",
    additional: "Использовать паттерн Strategy",
    status: Status.DRAFT,
    order: 1,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
    lessons: [
      { uuid: "660e8400-e29b-41d4-a716-446655440001", title: "Введение" },
    ],
  };

  test("должна принимать валидный проект", () => {
    expect(v.safeParse(ProjectSchema, validProject).success).toBe(true);
  });

  test("должна принимать проект только с обязательными полями", () => {
    expect(
      v.safeParse(ProjectSchema, {
        uuid: validProject.uuid,
        title: "Минимум",
        status: Status.PUBLISHED,
        order: 0,
        createdAt: validProject.createdAt,
        updatedAt: validProject.updatedAt,
      }).success,
    ).toBe(true);
  });

  test("должна принимать проект без уроков", () => {
    const { lessons, ...rest } = validProject;
    expect(v.safeParse(ProjectSchema, rest).success).toBe(true);
  });

  test("должна отклонять невалидный статус", () => {
    expect(
      v.safeParse(ProjectSchema, { ...validProject, status: "deleted" }).success,
    ).toBe(false);
  });

  test("должна отклонять невалидный UUID", () => {
    expect(
      v.safeParse(ProjectSchema, { ...validProject, uuid: "bad" }).success,
    ).toBe(false);
  });

  test("должна отклонять отрицательный order", () => {
    expect(
      v.safeParse(ProjectSchema, { ...validProject, order: -1 }).success,
    ).toBe(false);
  });
});
