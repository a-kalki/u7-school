import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { ProjectSchema, type Project } from "./project";
import { Status } from "../shared/status";

describe("Схема проекта (Project)", () => {
  const validProject: Project = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    title: "Проект",
    status: Status.DRAFT,
    order: 1,
    createdAt: "2026-05-01T12:00",
    lessons: [],
  };

  test("должна принимать валидный проект", () => {
    expect(v.safeParse(ProjectSchema, validProject).success).toBe(true);
  });

  test("должна принимать проект с пустым массивом уроков", () => {
    expect(v.safeParse(ProjectSchema, validProject).success).toBe(true);
  });

  test("должна принимать проект без updatedAt", () => {
    const { updatedAt, ...rest } = validProject;
    expect(v.safeParse(ProjectSchema, rest).success).toBe(true);
  });

  test("должна отклонять проект без lessons", () => {
    const { lessons, ...rest } = validProject;
    expect(v.safeParse(ProjectSchema, rest).success).toBe(false);
  });
});
