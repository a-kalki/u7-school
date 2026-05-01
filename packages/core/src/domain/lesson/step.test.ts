import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import {
  StepSchema,
  type Step,
  type TextStep,
  type CodeStep,
} from "./step";

describe("Схема шага (Step) — Text и Code", () => {
  const textStep: TextStep = {
    kind: "text",
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    description: "Прочитайте материал по теме «Переменные в TypeScript»",
    content: "Переменные объявляются с помощью let, const и var...",
    order: 1,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
  };

  const codeStep: CodeStep = {
    kind: "code",
    uuid: "550e8400-e29b-41d4-a716-446655440001",
    description: "Напишите функцию сложения двух чисел",
    code: "function add(a: number, b: number): number {\n  return a + b;\n}",
    language: "typescript",
    order: 2,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
  };

  test("должна принимать текстовый шаг", () => {
    expect(v.safeParse(StepSchema, textStep).success).toBe(true);
  });

  test("должна принимать шаг с кодом", () => {
    expect(v.safeParse(StepSchema, codeStep).success).toBe(true);
  });

  test("должна принимать шаг с кодом без языка", () => {
    const { language, ...rest } = codeStep;
    expect(v.safeParse(StepSchema, rest).success).toBe(true);
  });

  test("должна принимать текстовый шаг без контента (только описание)", () => {
    const { content, ...rest } = textStep;
    expect(v.safeParse(StepSchema, rest).success).toBe(true);
  });

  describe("Валидация", () => {
    test("должна отклонять шаг без kind", () => {
      const { kind, ...rest } = textStep;
      expect(v.safeParse(StepSchema, rest).success).toBe(false);
    });

    test("должна отклонять шаг без описания", () => {
      expect(
        v.safeParse(StepSchema, { ...textStep, description: "" }).success,
      ).toBe(false);
    });

    test("должна отклонять code-шаг без кода", () => {
      const { code, ...rest } = codeStep;
      expect(v.safeParse(StepSchema, rest).success).toBe(false);
    });
  });
});
