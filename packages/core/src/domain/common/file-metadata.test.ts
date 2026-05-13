import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { FileMetadataSchema } from "./file-metadata";

describe("FileMetadataSchema", () => {
	const valid = {
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		name: "лекция.pdf",
		mimeType: "application/pdf",
		size: 1024000,
		description: "Лекция",
	};

	test("принимает валидные метаданные", () => {
		expect(v.safeParse(FileMetadataSchema, valid).success).toBe(true);
	});

	test("принимает без description", () => {
		const { description: _d, ...minimal } = valid;
		expect(v.safeParse(FileMetadataSchema, minimal).success).toBe(true);
	});

	test("отклоняет невалидный uuid", () => {
		expect(
			v.safeParse(FileMetadataSchema, { ...valid, uuid: "bad" }).success,
		).toBe(false);
	});

	test("отклоняет пустое имя", () => {
		expect(
			v.safeParse(FileMetadataSchema, { ...valid, name: "" }).success,
		).toBe(false);
	});

	test("отклоняет пустой mimeType", () => {
		expect(
			v.safeParse(FileMetadataSchema, { ...valid, mimeType: "" }).success,
		).toBe(false);
	});

	test("отклоняет отрицательный size", () => {
		expect(
			v.safeParse(FileMetadataSchema, { ...valid, size: -1 }).success,
		).toBe(false);
	});
});
