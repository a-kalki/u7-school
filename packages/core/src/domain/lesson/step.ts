import * as v from "valibot";
import { FileMetadataSchema } from "./file";

const StepBase = {
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  description: v.pipe(v.string(), v.nonEmpty("Описание шага не может быть пустым")),
  order: v.pipe(v.number(), v.integer(), v.minValue(0)),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime("Некорректный формат даты"))),
};

/** Базовый шаг — описание с опциональным текстовым контентом */
const DefaultStepSchema = v.object({
  ...StepBase,
  kind: v.literal("default"),
  content: v.optional(v.string()),
});

/** Шаг с кодом — расширяет базовый: добавляет code и language */
const CodeStepSchema = v.object({
  ...StepBase,
  kind: v.literal("code"),
  content: v.optional(v.string()),
  code: v.pipe(v.string(), v.nonEmpty("Код не может быть пустым")),
  language: v.optional(v.string()),
});

/** Шаг с файлом — описание + прикреплённый файл */
const FileStepSchema = v.object({
  ...StepBase,
  kind: v.literal("file"),
  content: v.optional(v.string()),
  file: FileMetadataSchema,
});

export const StepSchema = v.variant("kind", [
  DefaultStepSchema,
  CodeStepSchema,
  FileStepSchema,
]);

export type DefaultStep = v.InferOutput<typeof DefaultStepSchema>;
export type CodeStep = v.InferOutput<typeof CodeStepSchema>;
export type FileStep = v.InferOutput<typeof FileStepSchema>;
export type Step = v.InferOutput<typeof StepSchema>;
