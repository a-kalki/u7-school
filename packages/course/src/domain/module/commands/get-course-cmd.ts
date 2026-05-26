import * as v from 'valibot';
import type { Course, CourseArMeta } from '../entity';
import { CourseCommonSchema } from '../entity';
import type { CourseNotFoundUcError } from './errors';

/** Схема валидации команды получения курса */
export const GetCourseCmdSchema = v.object({
  uuid: CourseCommonSchema.entries.uuid,
});

/** Команда получения курса */
export type GetCourseCmd = v.InferOutput<typeof GetCourseCmdSchema>;

/** Мета команды получения курса */
export interface GetCourseCmdMeta {
  ucName: 'get-course';
  arMeta: CourseArMeta;
  input: GetCourseCmd;
  output: Course;
  errors: GetCourseCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды получения курса */
export type GetCourseCmdError = CourseNotFoundUcError;
