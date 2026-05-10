import * as v from "valibot";
import { StatusSchema } from "../../status";
import type { Course, CourseArMeta } from "../entity";
import { CourseSchema } from "../entity";

/** Схема валидации команды списка курсов */
export const ListCoursesCmdSchema = v.object({
  status: v.optional(StatusSchema),
  authorId: v.optional(v.pipe(v.string(), v.uuid())),
  title: v.optional(v.string()),
  kind: v.optional(CourseSchema.entries.kind),
  tags: v.optional(v.array(v.string())),
  sort: v.optional(v.string()),
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
});

/** Команда списка курсов */
export type ListCoursesCmd = v.InferOutput<typeof ListCoursesCmdSchema>;

/** Мета команды списка курсов */
export interface ListCoursesCmdMeta {
  commandName: "list-courses";
  description: "Получить список курсов";
  arMeta: CourseArMeta;
  input: ListCoursesCmd;
  output: { courses: Course[] };
  errors: never;
  requiresAuth: false;
  type: "query";
}
