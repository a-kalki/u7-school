import * as v from 'valibot';
import type { Module, ModuleArMeta } from '../entity';
import { ModuleSchema } from '../entity';
import type { ModuleNotFoundUcError } from './errors';

/** Схема валидации команды получения модуля */
export const GetModuleCmdSchema = v.object({
  uuid: ModuleSchema.entries.uuid,
});

/** Команда получения модуля */
export type GetModuleCmd = v.InferOutput<typeof GetModuleCmdSchema>;

/** Мета команды получения модуля */
export interface GetModuleCmdMeta {
  ucName: 'get-module';
  arMeta: ModuleArMeta;
  input: GetModuleCmd;
  output: Module;
  errors: GetModuleCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды получения модуля */
export type GetModuleCmdError = ModuleNotFoundUcError;
