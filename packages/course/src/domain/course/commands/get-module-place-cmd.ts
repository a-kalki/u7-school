import * as v from 'valibot';
import { ModuleSchema } from '../../module/entity';
import type { CourseArMeta } from '../entity';

/** Схема места модуля в программе курса (линейный порядок фаз). */
export const ModulePlaceSchema = v.object({
  courseId: v.pipe(v.string(), v.uuid('Некорректный формат UUID курса')),
  isFirst: v.boolean(),
  isLast: v.boolean(),
  prevModuleId: v.optional(v.string()),
  nextModuleId: v.optional(v.string()),
});

/** Место модуля в программе курса. */
export type ModulePlace = v.InferOutput<typeof ModulePlaceSchema>;

/** Схема команды получения места модуля в программе. */
export const GetModulePlaceCmdSchema = v.object({
  moduleId: ModuleSchema.entries.uuid,
});

/** Команда получения места модуля в программе. */
export type GetModulePlaceCmd = v.InferOutput<typeof GetModulePlaceCmdSchema>;

/** Мета команды получения места модуля в программе. */
export interface GetModulePlaceCmdMeta {
  ucName: 'get-module-place';
  arMeta: CourseArMeta;
  input: GetModulePlaceCmd;
  output: ModulePlace | undefined;
  errors: GetModulePlaceCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды (модуль вне программы — это undefined, не ошибка). */
export type GetModulePlaceCmdError = never;
