import * as v from 'valibot';
import { ContentSnapshotSchema } from '../../content-snapshot';
import type { CourseArMeta } from '../entity';
import { CourseSchema } from '../entity';
import type { CourseNotFoundUcError } from './errors';

/** Схема программы курса — агрегация снимков модулей по фазам. */
export const CourseProgramSchema = v.object({
  course: CourseSchema,
  phases: v.array(
    v.object({
      title: v.string(),
      track: v.optional(v.string()),
      modules: v.array(ContentSnapshotSchema),
    }),
  ),
});

/** Программа курса (снимки модулей по фазам). */
export type CourseProgram = v.InferOutput<typeof CourseProgramSchema>;

/** Схема команды получения программы курса. */
export const GetCourseProgramCmdSchema = v.object({
  courseId: CourseSchema.entries.uuid,
});

/** Команда получения программы курса. */
export type GetCourseProgramCmd = v.InferOutput<
  typeof GetCourseProgramCmdSchema
>;

/** Мета команды получения программы курса. */
export interface GetCourseProgramCmdMeta {
  ucName: 'get-course-program';
  arMeta: CourseArMeta;
  input: GetCourseProgramCmd;
  output: CourseProgram;
  errors: GetCourseProgramCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды (курс не найден — COURSE_NOT_FOUND). */
export type GetCourseProgramCmdError = CourseNotFoundUcError;
