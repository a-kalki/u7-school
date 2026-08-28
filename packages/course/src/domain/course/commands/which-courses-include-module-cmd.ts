import * as v from 'valibot';
import { ModuleSchema } from '../../module/entity';
import type { CourseArMeta } from '../entity';
import { CourseSchema } from '../entity';

/** Схема команды исторической принадлежности модуля курсам. */
export const WhichCoursesIncludeModuleCmdSchema = v.object({
  moduleId: ModuleSchema.entries.uuid,
  courseIds: v.array(CourseSchema.entries.uuid),
});

/** Команда: какие из courseIds включают модуль — в т.ч. исторически. */
export type WhichCoursesIncludeModuleCmd = v.InferOutput<
  typeof WhichCoursesIncludeModuleCmdSchema
>;

/** Мета команды исторической принадлежности модуля курсам. */
export interface WhichCoursesIncludeModuleCmdMeta {
  ucName: 'which-courses-include-module';
  arMeta: CourseArMeta;
  input: WhichCoursesIncludeModuleCmd;
  output: string[];
  errors: WhichCoursesIncludeModuleCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды. */
export type WhichCoursesIncludeModuleCmdError = never;
