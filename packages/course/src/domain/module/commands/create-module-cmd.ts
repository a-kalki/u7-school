import * as v from 'valibot';
import type { Module, ModuleArMeta } from '../entity';
import { ModuleSchema } from '../entity';
import type {
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from './errors';

/** Схема валидации команды создания модуля — только базовые поля */
export const CreateModuleCmdSchema = v.object({
  title: ModuleSchema.entries.title,
  description: ModuleSchema.entries.description,
});

/** Команда создания модуля */
export type CreateModuleCmd = v.InferOutput<typeof CreateModuleCmdSchema>;

/** Мета команды создания модуля */
export interface CreateModuleCmdMeta {
  ucName: 'create-module';
  arMeta: ModuleArMeta;
  input: CreateModuleCmd;
  output: Module;
  errors: CreateModuleCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды создания модуля */
export type CreateModuleCmdError =
  | ModuleAccessDeniedUcError
  | ModuleNotFoundUcError;
