import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import {
	type CodeStep,
	type FileStep,
	StepSchema,
	type TextStep,
} from "./step";

describe("Схема шага (Step) — text | code | file", () => {
	const baseFields = {
		uuid: "550e8400-e29b-41d4-a716-446655440000",
		description: "Описание",
		order: 1,
		createdAt: "2026-05-01T12:00",
	};

	test("должна принимать text-шаг", () => {
		const s: TextStep = { ...baseFields, kind: "text" };
		expect(v.safeParse(StepSchema, s).success).toBe(true);
	});

	test("должна принимать text-шаг с контентом", () => {
		const s: TextStep = { ...baseFields, kind: "text", content: "Текст" };
		expect(v.safeParse(StepSchema, s).success).toBe(true);
	});

	test("должна принимать code-шаг", () => {
		const s: CodeStep = { ...baseFields, kind: "code", code: "console.log(1)" };
		expect(v.safeParse(StepSchema, s).success).toBe(true);
	});

	test("должна принимать code-шаг с контентом и языком", () => {
		const s: CodeStep = {
			...baseFields,
			kind: "code",
			content: "Пояснение",
			code: "print(1)",
			language: "python",
		};
		expect(v.safeParse(StepSchema, s).success).toBe(true);
	});

	test("должна принимать file-шаг", () => {
		const s: FileStep = {
			...baseFields,
			kind: "file",
			content: "Откройте файл",
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
