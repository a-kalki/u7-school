import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { FileMetadataSchema } from "./entity";

describe("FileMetadataSchema", () => {
	const valid = {
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		courseId: "660e8400-e29b-41d4-a716-446655440001",
		name: "лекция.pdf",
		url: "https://example.com/files/lecture.pdf",
		mimeType: "application/pdf",
		size: 1024000,
		description: "Лекция по математике",
		createdAt: "2026-05-01T12:00",
		updatedAt: "2026-05-01T13:00",
	};

	test("принимает валидные метаданные файла", () => {
		const result = v.safeParse(FileMetadataSchema, valid);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output).toMatchObject(valid);
		}
	});

	test("принимает без опциональных полей size, description, updatedAt", () => {
		const minimal = {
			uuid: valid.uuid,
			courseId: valid.courseId,
			name: valid.name,
			url: valid.url,
			mimeType: valid.mimeType,
			createdAt: valid.createdAt,
		};
		const result = v.safeParse(FileMetadataSchema, minimal);
		expect(result.success).toBe(true);
	});

	describe("поле uuid", () => {
		test("отклоняет невалидный UUID", () => {
			const result = v.safeParse(FileMetadataSchema, { ...valid, uuid: "bad" });
			expect(result.success).toBe(false);
		});
	});

	describe("поле courseId", () => {
		test("отклоняет невалидный UUID", () => {
			const result = v.safeParse(FileMetadataSchema, {
				...valid,
				courseId: "bad",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("поле name", () => {
		test("отклоняет пустое имя", () => {
			const result = v.safeParse(FileMetadataSchema, { ...valid, name: "" });
			expect(result.success).toBe(false);
		});
	});

	describe("поле mimeType", () => {
		test("отклоняет пустой mimeType", () => {
			const result = v.safeParse(FileMetadataSchema, {
				...valid,
				mimeType: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("поле url", () => {
		test("отклоняет пустой url", () => {
			const result = v.safeParse(FileMetadataSchema, { ...valid, url: "" });
			expect(result.success).toBe(false);
		});
	});

	describe("поле size", () => {
		test("отклоняет отрицательный размер", () => {
			const result = v.safeParse(FileMetadataSchema, { ...valid, size: -1 });
			expect(result.success).toBe(false);
		});

		test("отклоняет строку вместо числа", () => {
			const result = v.safeParse(FileMetadataSchema, { ...valid, size: "big" });
			expect(result.success).toBe(false);
		});
	});
});
