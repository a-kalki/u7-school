import * as v from 'valibot';
import type { Course, CourseArMeta } from '../entity';
import { CourseSchema } from '../entity';
import type { CourseAccessDeniedUcError } from './errors';

/** Схема команды создания курса */
export const CreateCourseCmdSchema = v.object({
  title: CourseSchema.entries.title,
  description: CourseSchema.entries.description,
});

/** Команда создания курса */
export type CreateCourseCmd = v.InferOutput<typeof CreateCourseCmdSchema>;

/** Мета команды создания курса */
export interface CreateCourseCmdMeta {
  ucName: 'create-course';
  arMeta: CourseArMeta;
  input: CreateCourseCmd;
  output: Course;
  errors: CreateCourseCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды создания курса */
export type CreateCourseCmdError = CourseAccessDeniedUcError;
