import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { LessonSchema, type Lesson } from "./lesson";
import { Status } from "../shared/status";
import type { Step } from "./step";

describe("Схема урока (Lesson)", () => {
  const baseStep: Step = {
    kind: "default",
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    description: "Описание шага",
    order: 1,
    createdAt: "2026-05-01T12:00",
  };

  const validLesson: Lesson = {
    uuid: "770e8400-e29b-41d4-a716-446655440002",
    title: "Введение в TypeScript",
    additional: "Рекомендуется после JS",
    status: Status.DRAFT,
    order: 1,
    createdAt: "2026-05-01T12:00",
    steps: [baseStep],
    mentorSteps: [baseStep],
  };

  test("должна принимать валидный урок", () => {
    expect(v.safeParse(LessonSchema, validLesson).success).toBe(true);
  });

  test("должна принимать урок с пустыми steps", () => {
    expect(v.safeParse(LessonSchema, { ...validLesson, steps: [] }).success).toBe(true);
  });

  test("должна принимать урок без mentorSteps", () => {
    const { mentorSteps, ...rest } = validLesson;
    expect(v.safeParse(LessonSchema, rest).success).toBe(true);
  });

  test("должна принимать урок без updatedAt", () => {
    const { updatedAt, ...rest } = validLesson;
    expect(v.safeParse(LessonSchema, rest).success).toBe(true);
  });

  test("должна отклонять урок без steps", () => {
    const { steps, ...rest } = validLesson;
    expect(v.safeParse(LessonSchema, rest).success).toBe(false);
  });
});
