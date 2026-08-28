import * as v from 'valibot';
import { ModuleSchema } from '../../module/entity';
import type { Course, CourseArMeta } from '../entity';
import { CourseSchema } from '../entity';

/** Схема команды поиска курса по модулю. */
export const GetCourseByModuleCmdSchema = v.object({
  moduleId: ModuleSchema.entries.uuid,
});

/** Команда поиска курса, содержащего модуль (в любом статусе). */
export type GetCourseByModuleCmd = v.InferOutput<
  typeof GetCourseByModuleCmdSchema
>;

/** Мета команды поиска курса по модулю. */
export interface GetCourseByModuleCmdMeta {
  ucName: 'get-course-by-module';
  arMeta: CourseArMeta;
  input: GetCourseByModuleCmd;
  output: Course | undefined;
  errors: GetCourseByModuleCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды (курс не найден — это undefined, не ошибка). */
export type GetCourseByModuleCmdError = never;
