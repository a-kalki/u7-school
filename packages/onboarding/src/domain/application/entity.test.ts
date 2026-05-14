import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { ApplicationSchema, type Application } from "./entity";
import { Experience } from "./experience";
import { Format } from "./format";
import { Goals } from "./goals";
import { Intensity } from "./intensity";
import { Source } from "./source";
import { ApplicationStatus } from "./status";

describe("ApplicationSchema", () => {
  const validApplication: Application = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    userId: "550e8400-e29b-41d4-a716-446655440001",
    status: ApplicationStatus.SUBMITTED,
    answers: {
      source: Source.TELEGRAM,
      interestReason: "Хочу учиться",
      experience: Experience.BEGINNER,
      format: Format.ONLINE,
      goals: Goals.CAREER_CHANGE,
      intensity: Intensity.BASE,
    },
    createdAt: "2024-01-01T00:00",
    submittedAt: "2024-01-01T00:00",
  };

  test("валидирует корректную заявку", () => {
    const result = v.safeParse(ApplicationSchema, validApplication);
    expect(result.success).toBe(true);
  });

  test("отклоняет невалидный uuid", () => {
    const invalid = { ...validApplication, uuid: "not-a-uuid" };
    const result = v.safeParse(ApplicationSchema, invalid);
    expect(result.success).toBe(false);
  });

  test("отклоняет невалидный userId", () => {
    const invalid = { ...validApplication, userId: "bad-id" };
    const result = v.safeParse(ApplicationSchema, invalid);
    expect(result.success).toBe(false);
  });

  test("отклоняет невалидный статус", () => {
    const invalid = { ...validApplication, status: "PENDING" };
    const result = v.safeParse(ApplicationSchema, invalid);
    expect(result.success).toBe(false);
  });

  test("отклоняет невалидную дату createdAt", () => {
    const invalid = { ...validApplication, createdAt: "yesterday-morning" };
    const result = v.safeParse(ApplicationSchema, invalid);
    expect(result.success).toBe(false);
  });

  test("отклоняет невалидную дату submittedAt", () => {
    const invalid = { ...validApplication, submittedAt: "tomorrow-evening" };
    const result = v.safeParse(ApplicationSchema, invalid);
    expect(result.success).toBe(false);
  });
});
