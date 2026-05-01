import * as v from "valibot";
import { ModuleSchema } from "./module";
import { ProjectSchema } from "./project";

/**
 * Базовые метаданные курса (общие для обоих вариантов).
 */
const CourseBaseSchema = v.object({
  /** Уникальный идентификатор курса */
  id: v.pipe(v.string(), v.nonEmpty("ID курса не может быть пустым")),
  /** Название курса */
  title: v.pipe(v.string(), v.nonEmpty("Название курса не может быть пустым")),
  /** Описание курса */
  description: v.pipe(
    v.string(),
    v.nonEmpty("Описание курса не может быть пустым"),
  ),
  /** ID автора (ментора), создавшего курс */
  authorId: v.pipe(
    v.string(),
    v.nonEmpty("ID автора не может быть пустым"),
  ),
  /** Для кого предназначен курс */
  targetAudience: v.optional(v.string()),
  /** Цель курса */
  goal: v.optional(v.string()),
  /** Что будет уметь студент в конце курса */
  result: v.optional(v.string()),
  /** Правила прохождения курса */
  rules: v.optional(v.string()),
  /** Дополнительная информация от ментора */
  additional: v.optional(v.string()),
});

/**
 * Курс, содержащий модули.
 * Ментор выбрал модульный подход.
 */
const CourseWithModulesSchema = v.object({
  ...CourseBaseSchema.entries,
  /** Тип курса — с модулями */
  kind: v.literal("modules"),
  /** Список модулей */
  modules: v.pipe(
    v.array(ModuleSchema),
    v.nonEmpty("Курс должен содержать хотя бы один модуль"),
  ),
});

/**
 * Курс, содержащий проекты напрямую.
 * Ментор выбрал проектный подход.
 */
const CourseWithProjectsSchema = v.object({
  ...CourseBaseSchema.entries,
  /** Тип курса — с проектами */
  kind: v.literal("projects"),
  /** Список проектов */
  projects: v.pipe(
    v.array(ProjectSchema),
    v.nonEmpty("Курс должен содержать хотя бы один проект"),
  ),
});

/**
 * Схема курса — исключающее ИЛИ:
 * курс содержит либо модули, либо проекты напрямую, но не оба одновременно.
 * Дискриминатор: поле kind ("modules" | "projects").
 */
export const CourseSchema = v.variant("kind", [
  CourseWithModulesSchema,
  CourseWithProjectsSchema,
]);

/** Тип курса с модулями */
export type CourseWithModules = v.InferOutput<typeof CourseWithModulesSchema>;

/** Тип курса с проектами */
export type CourseWithProjects = v.InferOutput<
  typeof CourseWithProjectsSchema
>;

/** Объединённый тип курса */
export type Course = v.InferOutput<typeof CourseSchema>;
