import * as v from 'valibot';
import type { Course, CourseArMeta } from '../entity';
import { CourseSchema } from '../entity';
import type {
  CourseAccessDeniedUcError,
  CourseNotFoundUcError,
} from './errors';

/** Схема команды добавления модуля в фазу курса */
export const AddModuleToCourseCmdSchema = v.object({
  courseId: CourseSchema.entries.uuid,
  phaseTitle: v.pipe(v.string(), v.trim(), v.nonEmpty()),
  moduleId: CourseSchema.entries.uuid,
});

/** Команда добавления модуля в фазу курса */
export type AddModuleToCourseCmd = v.InferOutput<
  typeof AddModuleToCourseCmdSchema
>;

/** Мета команды добавления модуля в фазу курса */
export interface AddModuleToCourseCmdMeta {
  ucName: 'add-module-to-course';
  arMeta: CourseArMeta;
  input: AddModuleToCourseCmd;
  output: Course;
  errors: AddModuleToCourseCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды добавления модуля */
export type AddModuleToCourseCmdError =
  | CourseAccessDeniedUcError
  | CourseNotFoundUcError;
