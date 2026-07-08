import * as v from 'valibot';
import { StatusSchema } from '../../status';
import type { Course, CourseArMeta } from '../entity';
import { CourseSchema } from '../entity';

/** Схема команды получения списка курсов */
export const ListCoursesCmdSchema = v.object({
  status: v.optional(StatusSchema),
  authorId: v.optional(CourseSchema.entries.authorId),
  title: v.optional(v.string()),
  sort: v.optional(v.string()),
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
});

/** Команда получения списка курсов */
export type ListCoursesCmd = v.InferOutput<typeof ListCoursesCmdSchema>;

/** Мета команды получения списка курсов */
export interface ListCoursesCmdMeta {
  ucName: 'list-courses';
  arMeta: CourseArMeta;
  input: ListCoursesCmd;
  output: Course[];
  errors: never;
  requiresAuth: false;
  type: 'query';
}
