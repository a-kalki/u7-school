import * as v from "valibot";
import { StatusSchema } from "../shared/status";
import { ModuleSchema } from "../module/module";
import { ProjectSchema } from "../project/project";

const CourseBaseSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  title: v.pipe(v.string(), v.nonEmpty("Название курса не может быть пустым")),
  description: v.pipe(v.string(), v.nonEmpty("Описание курса не может быть пустым")),
  authorId: v.pipe(v.string(), v.uuid("Некорректный формат UUID автора")),
  targetAudience: v.optional(v.string()),
  goal: v.optional(v.string()),
  result: v.optional(v.string()),
  rules: v.optional(v.string()),
  additional: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  status: StatusSchema,
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime("Некорректный формат даты"))),
});

/** Курс с модулями */
const CourseWithModulesSchema = v.object({
  ...CourseBaseSchema.entries,
  kind: v.literal("modules"),
  modules: v.array(ModuleSchema),
});

/** Курс с проектами */
const CourseWithProjectsSchema = v.object({
  ...CourseBaseSchema.entries,
  kind: v.literal("projects"),
  projects: v.array(ProjectSchema),
});

/** Схема курса — исключающее ИЛИ (модули | проекты) */
export const CourseSchema = v.variant("kind", [
  CourseWithModulesSchema,
  CourseWithProjectsSchema,
]);

export type CourseWithModules = v.InferOutput<typeof CourseWithModulesSchema>;
export type CourseWithProjects = v.InferOutput<typeof CourseWithProjectsSchema>;
export type Course = v.InferOutput<typeof CourseSchema>;
