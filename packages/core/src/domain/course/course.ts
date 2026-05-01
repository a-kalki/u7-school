import * as v from "valibot";
import { StatusSchema } from "../shared/status";
import { ModuleSchema } from "../module/module";
import { ProjectSchema } from "../project/project";

/** Базовые поля для всех вариантов курса */
const CourseBaseSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  title: v.pipe(v.string(), v.nonEmpty("Название курса не может быть пустым")),
  description: v.pipe(
    v.string(),
    v.nonEmpty("Описание курса не может быть пустым"),
  ),
  authorId: v.pipe(v.string(), v.uuid("Некорректный формат UUID автора")),
  targetAudience: v.optional(v.string()),
  goal: v.optional(v.string()),
  result: v.optional(v.string()),
  rules: v.optional(v.string()),
  additional: v.optional(v.string()),
  status: StatusSchema,
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
});

/** Курс с модулями */
const CourseWithModulesSchema = v.object({
  ...CourseBaseSchema.entries,
  kind: v.literal("modules"),
  modules: v.pipe(
    v.array(ModuleSchema),
    v.nonEmpty("Курс должен содержать хотя бы один модуль"),
  ),
});

/** Курс с проектами */
const CourseWithProjectsSchema = v.object({
  ...CourseBaseSchema.entries,
  kind: v.literal("projects"),
  projects: v.pipe(
    v.array(ProjectSchema),
    v.nonEmpty("Курс должен содержать хотя бы один проект"),
  ),
});

/** Схема курса — исключающее ИЛИ */
export const CourseSchema = v.variant("kind", [
  CourseWithModulesSchema,
  CourseWithProjectsSchema,
]);

export type CourseWithModules = v.InferOutput<typeof CourseWithModulesSchema>;
export type CourseWithProjects = v.InferOutput<typeof CourseWithProjectsSchema>;
export type Course = v.InferOutput<typeof CourseSchema>;
