import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseSchema, ModuleSchema, ProjectSchema } from "../entity";
import type { CourseAccessDeniedUcError } from "./errors";

/** Схема валидации команды создания курса */
export const CreateCourseCmdSchema = v.object({
  title: CourseSchema.entries.title,
  description: CourseSchema.entries.description,
  kind: CourseSchema.entries.kind,
  targetAudience: CourseSchema.entries.targetAudience,
  goal: CourseSchema.entries.goal,
  result: CourseSchema.entries.result,
  rules: CourseSchema.entries.rules,
  additional: CourseSchema.entries.additional,
  tags: CourseSchema.entries.tags,
  status: CourseSchema.entries.status,
  modules: v.optional(v.array(ModuleSchema)),
  projects: v.optional(v.array(ProjectSchema)),
});

/** Команда создания курса */
export type CreateCourseCmd = v.InferOutput<typeof CreateCourseCmdSchema>;

/** Мета команды создания курса */
export interface CreateCourseCmdMeta {
  commandName: "create-course";
  description: "Создать курс";
  arMeta: CourseArMeta;
  input: CreateCourseCmd;
  output: Course;
  errors: CreateCourseCmdError;
  requiresAuth: true;
  type: "command";
}

/** Ошибки команды создания курса */
export type CreateCourseCmdError = CourseAccessDeniedUcError;
