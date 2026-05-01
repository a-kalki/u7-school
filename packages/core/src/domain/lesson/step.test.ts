import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { StepSchema, type DefaultStep, type CodeStep, type FileStep } from "./step";

describe("Схема шага (Step) — default | code | file", () => {
  const baseFields = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    description: "Описание",
    order: 1,
    createdAt: "2026-05-01T12:00",
  };

  test("должна принимать default-шаг", () => {
    const s: DefaultStep = { ...baseFields, kind: "default" };
    expect(v.safeParse(StepSchema, s).success).toBe(true);
  });

  test("должна принимать default-шаг с контентом", () => {
    const s: DefaultStep = { ...baseFields, kind: "default", content: "Текст" };
    expect(v.safeParse(StepSchema, s).success).toBe(true);
  });

  test("должна принимать code-шаг", () => {
    const s: CodeStep = { ...baseFields, kind: "code", code: "console.log(1)" };
    expect(v.safeParse(StepSchema, s).success).toBe(true);
  });

  test("должна принимать code-шаг с языком", () => {
    const s: CodeStep = { ...baseFields, kind: "code", code: "print(1)", language: "python" };
    expect(v.safeParse(StepSchema, s).success).toBe(true);
  });

  test("должна принимать file-шаг", () => {
    const s: FileStep = {
      ...baseFields,
      kind: "file",
      file: {
        uuid: "660e8400-e29b-41d4-a716-446655440001",
        name: "file.pdf",
        url: "https://example.com/file.pdf",
        mimeType: "application/pdf",
        createdAt: "2026-05-01T12:00",
      },
    };
    expect(v.safeParse(StepSchema, s).success).toBe(true);
  });

  test("должна отклонять code-шаг без кода", () => {
    expect(
      v.safeParse(StepSchema, { ...baseFields, kind: "code" }).success,
    ).toBe(false);
  });

  test("должна отклонять file-шаг без файла", () => {
    expect(
      v.safeParse(StepSchema, { ...baseFields, kind: "file" }).success,
    ).toBe(false);
  });
});
