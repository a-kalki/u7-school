import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseSchema } from "../entity";
import type { CourseNotFoundUcError } from "./errors";

/** Схема валидации команды получения курса */
export const GetCourseCmdSchema = v.object({
  uuid: CourseSchema.entries.uuid,
});

/** Команда получения курса */
export type GetCourseCmd = v.InferOutput<typeof GetCourseCmdSchema>;

/** Мета команды получения курса */
export interface GetCourseCmdMeta {
  commandName: "get-course";
  description: "Получить курс по UUID";
  arMeta: CourseArMeta;
  input: GetCourseCmd;
  output: Course;
  errors: GetCourseCmdError;
  requiresAuth: false;
  type: "query";
}

/** Ошибки команды получения курса */
export type GetCourseCmdError = CourseNotFoundUcError;
