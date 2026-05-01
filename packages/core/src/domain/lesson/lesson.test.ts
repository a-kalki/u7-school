import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { LessonSchema, type Lesson } from "./lesson";
import { Status } from "../shared/status";
import type { Step } from "./step";
import type { FileMetadata } from "./file";

describe("Схема урока (Lesson)", () => {
  const textStep: Step = {
    kind: "text",
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    description: "Прочитайте теорию",
    order: 1,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
  };

  const file: FileMetadata = {
    uuid: "660e8400-e29b-41d4-a716-446655440001",
    name: "материал.pdf",
    url: "https://files.u7-school.dev/material.pdf",
    mimeType: "application/pdf",
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
  };

  const validLesson: Lesson = {
    uuid: "770e8400-e29b-41d4-a716-446655440002",
    title: "Введение в TypeScript",
    additional: "Рекомендуется проходить после основ JavaScript",
    status: Status.DRAFT,
    order: 1,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
    steps: [textStep],
    files: [file],
  };

  test("должна принимать валидный урок", () => {
    expect(v.safeParse(LessonSchema, validLesson).success).toBe(true);
  });

  test("должна принимать урок без additional, steps, files", () => {
    const minimal: Lesson = {
      uuid: validLesson.uuid,
      title: "Минимум",
      status: Status.PUBLISHED,
      order: 0,
      createdAt: validLesson.createdAt,
      updatedAt: validLesson.updatedAt,
    };
    expect(v.safeParse(LessonSchema, minimal).success).toBe(true);
  });

  test("должна принимать урок с пустыми steps и files", () => {
    expect(
      v.safeParse(LessonSchema, {
        ...validLesson,
        steps: [],
        files: [],
      }).success,
    ).toBe(true);
  });

  test("должна отклонять урок без названия", () => {
    expect(
      v.safeParse(LessonSchema, { ...validLesson, title: "" }).success,
    ).toBe(false);
  });

  test("должна отклонять урок с невалидным статусом", () => {
    expect(
      v.safeParse(LessonSchema, { ...validLesson, status: "deleted" }).success,
    ).toBe(false);
  });
});
