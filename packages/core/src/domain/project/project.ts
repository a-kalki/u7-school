import * as v from "valibot";
import { StatusSchema } from "../shared/status";

// Временная заглушка для урока (замена на LessonSchema в Фазе 4)
const LessonRefSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid()),
  title: v.string(),
});

/**
 * Схема проекта. Основная рабочая единица, содержит список уроков.
 */
export const ProjectSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  title: v.pipe(v.string(), v.nonEmpty("Название проекта не может быть пустым")),
  goal: v.optional(v.string()),
  result: v.optional(v.string()),
  additional: v.optional(v.string()),
  status: StatusSchema,
  /** Порядковый номер для сортировки внутри модуля/курса */
  order: v.pipe(v.number(), v.integer(), v.minValue(0)),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  /** Список уроков в проекте (опционально) */
  lessons: v.optional(v.array(LessonRefSchema)),
});

export type Project = v.InferOutput<typeof ProjectSchema>;
