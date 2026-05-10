import * as v from "valibot";
import { StatusSchema } from "../status";

/** Общие поля для всех вариантов шага */
export const StepCommonSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	courseId: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	description: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Описание не может быть пустым"),
	),
	content: v.optional(v.string()),
	status: StatusSchema,
	order: v.pipe(
		v.number(),
		v.integer("order должен быть целым числом"),
		v.minValue(0, "order не может быть отрицательным"),
	),
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
});

/** Вариант text — текстовый шаг */
const TextStepSchema = v.object({
	...StepCommonSchema.entries,
	kind: v.literal("text"),
});

/** Вариант code — шаг с кодом */
const CodeStepSchema = v.object({
	...StepCommonSchema.entries,
	kind: v.literal("code"),
	code: v.pipe(v.string(), v.nonEmpty("Код не может быть пустым")),
	language: v.optional(v.string()),
});

/** Вариант file — шаг с файлом */
const FileStepSchema = v.object({
	...StepCommonSchema.entries,
	kind: v.literal("file"),
	fileId: v.pipe(v.string(), v.uuid("Некорректный формат UUID для fileId")),
});

/** Схема валидации шага (discriminated union по kind) */
export const StepSchema = v.variant("kind", [
	TextStepSchema,
	CodeStepSchema,
	FileStepSchema,
]);

export type Step = v.InferOutput<typeof StepSchema>;

export type StepText = v.InferOutput<typeof TextStepSchema>;
export type StepCode = v.InferOutput<typeof CodeStepSchema>;
export type StepFile = v.InferOutput<typeof FileStepSchema>;

/** Метаданные агрегата Step */
export interface StepArMeta {
	name: "step";
	label: "Шаг";
	errors: never;
	state: Step;
}
