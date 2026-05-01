import * as v from "valibot";
import { ProjectSchema } from "./project";

/**
 * Общие поля модуля.
 */
const ModuleBaseSchema = v.object({
  /** Уникальный идентификатор модуля */
  id: v.pipe(v.string(), v.nonEmpty("ID модуля не может быть пустым")),
  /** Название модуля */
  title: v.pipe(v.string(), v.nonEmpty("Название модуля не может быть пустым")),
  /** Цель модуля */
  goal: v.optional(v.string()),
  /** Результат прохождения модуля */
  result: v.optional(v.string()),
  /** Дополнительная информация */
  additional: v.optional(v.string()),
});

// Временная заглушка для элемента урока (будет заменена на LessonSchema)
const LessonRefSchema = v.object({
  id: v.string(),
  title: v.string(),
});

/**
 * Схема модуля с проектами.
 * Модуль содержит список проектов.
 */
const ModuleWithProjectsSchema = v.object({
  ...ModuleBaseSchema.entries,
  /** Тип модуля — с проектами */
  kind: v.literal("projects"),
  /** Список проектов в модуле */
  projects: v.array(ProjectSchema),
});

/**
 * Схема модуля с уроками.
 * Модуль содержит список уроков.
 */
const ModuleWithLessonsSchema = v.object({
  ...ModuleBaseSchema.entries,
  /** Тип модуля — с уроками */
  kind: v.literal("lessons"),
  /** Список уроков в модуле */
  lessons: v.array(LessonRefSchema),
});

/**
 * Схема модуля — исключающее ИЛИ:
 * модуль содержит либо проекты, либо уроки, но не оба одновременно.
 * Дискриминатор: поле kind ("projects" | "lessons").
 */
export const ModuleSchema = v.variant("kind", [
  ModuleWithProjectsSchema,
  ModuleWithLessonsSchema,
]);

/** Тип модуля с проектами */
export type ModuleWithProjects = v.InferOutput<
  typeof ModuleWithProjectsSchema
>;

/** Тип модуля с уроками */
export type ModuleWithLessons = v.InferOutput<
  typeof ModuleWithLessonsSchema
>;

/** Объединённый тип модуля */
export type Module = v.InferOutput<typeof ModuleSchema>;
