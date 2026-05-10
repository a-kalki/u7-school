import { describe, expect, test } from "bun:test";
import { Status } from "../status";
import { StepAr } from "./a-root";

const textCmd = {
  courseId: "660e8400-e29b-41d4-a716-446655440001",
  kind: "text" as const,
  description: "Текстовый шаг",
  status: Status.DRAFT,
  order: 1,
};

const codeCmd = {
  courseId: "660e8400-e29b-41d4-a716-446655440001",
  kind: "code" as const,
  description: "Шаг с кодом",
  code: "console.log('test')",
  language: "typescript",
  status: Status.PUBLISHED,
  order: 2,
};

const fileCmd = {
  courseId: "660e8400-e29b-41d4-a716-446655440001",
  kind: "file" as const,
  description: "Шаг с файлом",
  fileId: "770e8400-e29b-41d4-a716-446655440004",
  status: Status.ARCHIVED,
  order: 3,
};

describe("StepAr", () => {
  describe("create", () => {
    test("создаёт text-шаг", () => {
      const ar = StepAr.create(textCmd);
      expect(ar.state.kind).toBe("text");
      expect(ar.state.description).toBe("Текстовый шаг");
      expect(ar.state.uuid).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
    });

    test("создаёт code-шаг", () => {
      const ar = StepAr.create(codeCmd);
      expect(ar.state.kind).toBe("code");
      if (ar.state.kind === "code") {
        expect(ar.state.code).toBe("console.log('test')");
        expect(ar.state.language).toBe("typescript");
      }
    });

    test("создаёт code-шаг без language", () => {
      const ar = StepAr.create({ ...codeCmd, language: undefined });
      expect(ar.state.kind).toBe("code");
      if (ar.state.kind === "code") {
        expect(ar.state.language).toBeUndefined();
      }
    });

    test("создаёт file-шаг", () => {
      const ar = StepAr.create(fileCmd);
      expect(ar.state.kind).toBe("file");
      if (ar.state.kind === "file") {
        expect(ar.state.fileId).toBe("770e8400-e29b-41d4-a716-446655440004");
      }
    });

    test("не создаёт updatedAt при создании", () => {
      const ar = StepAr.create(textCmd);
      expect(ar.state.updatedAt).toBeUndefined();
    });
  });
});
