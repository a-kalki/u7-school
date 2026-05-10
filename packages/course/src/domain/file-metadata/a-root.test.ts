import { describe, expect, test } from "bun:test";
import { FileMetadataAr } from "./a-root";

const validCmd = {
  courseId: "660e8400-e29b-41d4-a716-446655440001",
  name: "лекция.pdf",
  url: "https://example.com/files/lecture.pdf",
  mimeType: "application/pdf",
  size: 1024000,
  description: "Лекция",
};

describe("FileMetadataAr", () => {
  describe("create", () => {
    test("генерирует UUID и createdAt", () => {
      const ar = FileMetadataAr.create(validCmd);
      expect(ar.state.uuid).toBeString();
      expect(ar.state.uuid).toMatch(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
      expect(ar.state.createdAt).toBeString();
      expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    test("сохраняет переданные поля", () => {
      const ar = FileMetadataAr.create(validCmd);
      expect(ar.state.courseId).toBe(validCmd.courseId);
      expect(ar.state.name).toBe("лекция.pdf");
      expect(ar.state.url).toBe(validCmd.url);
      expect(ar.state.mimeType).toBe("application/pdf");
      expect(ar.state.size).toBe(1024000);
      expect(ar.state.description).toBe("Лекция");
    });

    test("не создаёт updatedAt при создании", () => {
      const ar = FileMetadataAr.create(validCmd);
      expect(ar.state.updatedAt).toBeUndefined();
    });

    test("принимает команду без опциональных полей", () => {
      const ar = FileMetadataAr.create({
        courseId: validCmd.courseId,
        name: "файл.txt",
        url: "https://example.com/file.txt",
        mimeType: "text/plain",
      });
      expect(ar.state.size).toBeUndefined();
      expect(ar.state.description).toBeUndefined();
    });
  });
});
