import * as v from 'valibot';
import { StatusSchema } from '../../status';
import type { Module, ModuleArMeta } from '../entity';

/** Схема валидации команды списка модулей */
export const ListModulesCmdSchema = v.object({
  status: v.optional(StatusSchema),
  authorId: v.optional(v.pipe(v.string(), v.uuid())),
  title: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  sort: v.optional(v.string()),
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
});

/** Команда списка модулей */
export type ListModulesCmd = v.InferOutput<typeof ListModulesCmdSchema>;

/** Мета команды списка модулей */
export interface ListModulesCmdMeta {
  ucName: 'list-modules';
  arMeta: ModuleArMeta;
  input: ListModulesCmd;
  output: Module[];
  errors: never;
  requiresAuth: false;
  type: 'query';
}
