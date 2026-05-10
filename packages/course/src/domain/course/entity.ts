import * as v from "valibot";
import { StatusSchema } from "../status";

/** Схема модуля (value-object внутри Course) */
export const ModuleSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID модуля")),
  title: v.pipe(v.string(), v.trim(), v.nonEmpty("Заголовок модуля не может быть пустым")),
  goal: v.optional(v.string()),
  result: v.optional(v.string()),
  additional: v.optional(v.string()),
  status: StatusSchema,
  order: v.pipe(v.number(), v.integer("order должен быть целым числом"), v.minValue(0, "order не может быть отрицательным")),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime("Некорректный формат даты"))),
});

export type Module = v.InferOutput<typeof ModuleSchema>;

/** Схема проекта (value-object внутри Course) */
export const ProjectSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID проекта")),
  title: v.pipe(v.string(), v.trim(), v.nonEmpty("Заголовок проекта не может быть пустым")),
  goal: v.optional(v.string()),
  result: v.optional(v.string()),
  additional: v.optional(v.string()),
  status: StatusSchema,
  order: v.pipe(v.number(), v.integer("order должен быть целым числом"), v.minValue(0, "order не может быть отрицательным")),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime("Некорректный формат даты"))),
  lessonIds: v.array(v.pipe(v.string(), v.uuid("Некорректный формат UUID lessonIds"))),
});

export type Project = v.InferOutput<typeof ProjectSchema>;

/** Общие поля курса */
const CourseCommonSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  title: v.pipe(v.string(), v.trim(), v.nonEmpty("Заголовок не может быть пустым")),
  description: v.pipe(v.string(), v.trim(), v.nonEmpty("Описание не может быть пустым")),
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

/** Вариант modules — курс с модулями */
const ModulesCourseSchema = v.object({
  ...CourseCommonSchema.entries,
  kind: v.literal("modules"),
  modules: v.array(ModuleSchema),
});

/** Вариант projects — курс с проектами */
const ProjectsCourseSchema = v.object({
  ...CourseCommonSchema.entries,
  kind: v.literal("projects"),
  projects: v.array(ProjectSchema),
});

/** Схема валидации курса (discriminated union по kind) */
export const CourseSchema = v.variant("kind", [
  ModulesCourseSchema,
  ProjectsCourseSchema,
]);

export type Course = v.InferOutput<typeof CourseSchema>;
export type CourseModules = v.InferOutput<typeof ModulesCourseSchema>;
export type CourseProjects = v.InferOutput<typeof ProjectsCourseSchema>;

/** Метаданные агрегата Course */
export interface CourseArMeta {
  name: "course";
  label: "Курс";
  errors: never;
  state: Course;
}
