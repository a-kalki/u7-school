import * as v from "valibot";
import { FileMetadataSchema } from "./file";

const StepBase = {
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  description: v.pipe(v.string(), v.nonEmpty("Описание шага не может быть пустым")),
  content: v.optional(v.string()),
  order: v.pipe(v.number(), v.integer(), v.minValue(0)),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime("Некорректный формат даты"))),
};

/** Текстовый шаг — описание + опциональный текстовый контент */
const TextStepSchema = v.object({
  ...StepBase,
  kind: v.literal("text"),
});

/** Шаг с кодом — добавляет code и language */
const CodeStepSchema = v.object({
  ...StepBase,
  kind: v.literal("code"),
  code: v.pipe(v.string(), v.nonEmpty("Код не может быть пустым")),
  language: v.optional(v.string()),
});

/** Шаг с файлом — добавляет прикреплённый файл */
const FileStepSchema = v.object({
  ...StepBase,
  kind: v.literal("file"),
  file: FileMetadataSchema,
});

export const StepSchema = v.variant("kind", [
  TextStepSchema,
  CodeStepSchema,
  FileStepSchema,
]);

export type TextStep = v.InferOutput<typeof TextStepSchema>;
export type CodeStep = v.InferOutput<typeof CodeStepSchema>;
export type FileStep = v.InferOutput<typeof FileStepSchema>;
export type Step = v.InferOutput<typeof StepSchema>;
