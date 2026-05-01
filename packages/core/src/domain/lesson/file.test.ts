import { describe, test, expect } from "bun:test";
import * as v from "valibot";
import { FileMetadataSchema, type FileMetadata } from "./file";

describe("Схема файла (FileMetadata)", () => {
  const validFile: FileMetadata = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    name: "инструкция.pdf",
    url: "https://files.u7-school.dev/course-1/module-1/instruction.pdf",
    mimeType: "application/pdf",
    size: 1048576,
    createdAt: "2026-05-01T12:00",
    updatedAt: "2026-05-01T12:00",
  };

  test("должна принимать валидный файл со всеми полями", () => {
    expect(v.safeParse(FileMetadataSchema, validFile).success).toBe(true);
  });

  test("должна принимать файл без размера", () => {
    const { size, ...rest } = validFile;
    expect(v.safeParse(FileMetadataSchema, rest).success).toBe(true);
  });

  describe("Валидация имени", () => {
    test("должна отклонять файл без имени", () => {
      const { name, ...rest } = validFile;
      expect(v.safeParse(FileMetadataSchema, rest).success).toBe(false);
    });

    test("должна отклонять файл с пустым именем", () => {
      expect(
        v.safeParse(FileMetadataSchema, { ...validFile, name: "" }).success,
      ).toBe(false);
    });
  });

  describe("Валидация URL", () => {
    test("должна отклонять файл без URL", () => {
      const { url, ...rest } = validFile;
      expect(v.safeParse(FileMetadataSchema, rest).success).toBe(false);
    });

    test("должна отклонять невалидный URL", () => {
      expect(
        v.safeParse(FileMetadataSchema, { ...validFile, url: "не-url" })
          .success,
      ).toBe(false);
    });
  });

  describe("Валидация mimeType", () => {
    test("должна отклонять файл без mimeType", () => {
      const { mimeType, ...rest } = validFile;
      expect(v.safeParse(FileMetadataSchema, rest).success).toBe(false);
    });
  });
});
