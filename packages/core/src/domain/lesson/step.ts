import * as v from "valibot";

/** Общие поля шага */
const StepBaseSchema = {
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  description: v.pipe(
    v.string(),
    v.nonEmpty("Описание шага не может быть пустым"),
  ),
  order: v.pipe(v.number(), v.integer(), v.minValue(0)),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
};

/**
 * Текстовый шаг — теоретический материал для чтения.
 */
const TextStepSchema = v.object({
  ...StepBaseSchema,
  kind: v.literal("text"),
  /** Текстовое содержимое (опционально) */
  content: v.optional(v.string()),
});

/**
 * Шаг с кодом — практическое задание.
 */
const CodeStepSchema = v.object({
  ...StepBaseSchema,
  kind: v.literal("code"),
  /** Исходный код задания */
  code: v.pipe(v.string(), v.nonEmpty("Код не может быть пустым")),
  /** Язык программирования (опционально) */
  language: v.optional(v.string()),
});

/**
 * Схема шага — text | code (дискриминатор: kind).
 */
export const StepSchema = v.variant("kind", [
  TextStepSchema,
  CodeStepSchema,
]);

export type TextStep = v.InferOutput<typeof TextStepSchema>;
export type CodeStep = v.InferOutput<typeof CodeStepSchema>;
export type Step = v.InferOutput<typeof StepSchema>;
