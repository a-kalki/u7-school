import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { type FileMetadata, FileMetadataSchema } from "./file";

describe("Схема файла (FileMetadata)", () => {
	const validFile: FileMetadata = {
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		name: "инструкция.pdf",
		url: "https://files.u7-school.dev/instruction.pdf",
		mimeType: "application/pdf",
		createdAt: "2026-05-01T12:00",
	};

	test("должна принимать валидный файл", () => {
		expect(v.safeParse(FileMetadataSchema, validFile).success).toBe(true);
	});

	test("должна принимать файл с updatedAt и size", () => {
		expect(
			v.safeParse(FileMetadataSchema, {
				...validFile,
				updatedAt: "2026-05-01T12:00",
				size: 1024,
			}).success,
		).toBe(true);
	});

	test("должна отклонять файл без имени", () => {
		const { name, ...rest } = validFile;
		expect(v.safeParse(FileMetadataSchema, rest).success).toBe(false);
	});

	test("должна отклонять невалидный URL", () => {
		expect(
			v.safeParse(FileMetadataSchema, { ...validFile, url: "не-url" }).success,
		).toBe(false);
	});
});
