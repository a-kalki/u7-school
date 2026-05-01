import * as v from "valibot";
import { StatusSchema } from "../shared/status";
import { StepSchema } from "./step";
import { FileMetadataSchema } from "./file";

/**
 * Схема урока. Изучение темы, состоит из шагов и прикреплённых файлов.
 */
export const LessonSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  title: v.pipe(v.string(), v.nonEmpty("Название урока не может быть пустым")),
  additional: v.optional(v.string()),
  status: StatusSchema,
  order: v.pipe(v.number(), v.integer(), v.minValue(0)),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  /** Шаги урока (опционально) */
  steps: v.optional(v.array(StepSchema)),
  /** Прикреплённые файлы (опционально) */
  files: v.optional(v.array(FileMetadataSchema)),
});

export type Lesson = v.InferOutput<typeof LessonSchema>;
