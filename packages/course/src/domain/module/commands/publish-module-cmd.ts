import * as v from 'valibot';
import type { Module, ModuleArMeta } from '../entity';
import { ModuleSchema } from '../entity';
import type {
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from './errors';

/** Схема валидации команды публикации модуля */
export const PublishModuleCmdSchema = v.object({
  moduleId: ModuleSchema.entries.uuid,
});

/** Команда публикации модуля */
export type PublishModuleCmd = v.InferOutput<typeof PublishModuleCmdSchema>;

/** Мета команды публикации модуля */
export interface PublishModuleCmdMeta {
  ucName: 'publish-module';
  arMeta: ModuleArMeta;
  input: PublishModuleCmd;
  output: Module;
  errors: PublishModuleCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды публикации модуля */
export type PublishModuleCmdError =
  | ModuleAccessDeniedUcError
  | ModuleNotFoundUcError;
