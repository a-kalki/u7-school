import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Status } from "../status";
import { StepSchema } from "./entity";

const validText = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	courseId: "660e8400-e29b-41d4-a716-446655440001",
	kind: "text" as const,
	description: "Прочитайте текст",
	status: Status.DRAFT,
	order: 1,
	createdAt: "2026-05-01T12:00",
	updatedAt: "2026-05-01T13:00",
};

const validCode = {
	uuid: "550e8400-e29b-41d4-a716-446655440002",
	courseId: "660e8400-e29b-41d4-a716-446655440001",
	kind: "code" as const,
	description: "Напишите функцию",
	content: "Код...",
	code: "console.log('hello')",
	language: "typescript",
	status: Status.PUBLISHED,
	order: 2,
	createdAt: "2026-05-01T12:00",
};

const validFile = {
	uuid: "550e8400-e29b-41d4-a716-446655440003",
	courseId: "660e8400-e29b-41d4-a716-446655440001",
	kind: "file" as const,
	description: "Скачайте файл",
	content: "Описание",
	fileId: "770e8400-e29b-41d4-a716-446655440004",
	status: Status.ARCHIVED,
	order: 3,
	createdAt: "2026-05-01T12:00",
};

describe("StepSchema", () => {
	test("принимает text-шаг", () => {
		const result = v.safeParse(StepSchema, validText);
		expect(result.success).toBe(true);
	});

	test("принимает code-шаг", () => {
		const result = v.safeParse(StepSchema, validCode);
		expect(result.success).toBe(true);
	});

	test("принимает code-шаг без language", () => {
		const { language, ...withoutLang } = validCode;
		const result = v.safeParse(StepSchema, withoutLang);
		expect(result.success).toBe(true);
	});

	test("принимает file-шаг", () => {
		const result = v.safeParse(StepSchema, validFile);
		expect(result.success).toBe(true);
	});

	test("принимает text-шаг без опциональных content, updatedAt", () => {
		const minimal = {
			uuid: validText.uuid,
			courseId: validText.courseId,
			kind: "text" as const,
			description: "Минимум",
			status: Status.DRAFT,
			order: 1,
			createdAt: validText.createdAt,
		};
		const result = v.safeParse(StepSchema, minimal);
		expect(result.success).toBe(true);
	});

	test("отклоняет code-шаг без code", () => {
		const { code, ...noCode } = validCode;
		const result = v.safeParse(StepSchema, noCode);
		expect(result.success).toBe(false);
	});

	test("отклоняет file-шаг без fileId", () => {
		const { fileId, ...noFileId } = validFile;
		const result = v.safeParse(StepSchema, noFileId);
		expect(result.success).toBe(false);
	});

	test("отклоняет невалидный kind", () => {
		const result = v.safeParse(StepSchema, { ...validText, kind: "video" });
		expect(result.success).toBe(false);
	});

	test("отклоняет пустое описание", () => {
		const result = v.safeParse(StepSchema, { ...validText, description: "" });
		expect(result.success).toBe(false);
	});
});
