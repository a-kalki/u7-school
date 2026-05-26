import * as v from 'valibot';
import type { Module, ModuleArMeta } from '../entity';
import { ModuleSchema } from '../entity';
import type {
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from './errors';

/** Схема валидации команды обогащения модуля */
export const EnrichModuleCmdSchema = v.object({
  moduleId: ModuleSchema.entries.uuid,
  targetAudience: ModuleSchema.entries.targetAudience,
  goal: ModuleSchema.entries.goal,
  result: ModuleSchema.entries.result,
  rules: ModuleSchema.entries.rules,
  additional: ModuleSchema.entries.additional,
  tags: ModuleSchema.entries.tags,
});

/** Команда обогащения модуля */
export type EnrichModuleCmd = v.InferOutput<typeof EnrichModuleCmdSchema>;

/** Мета команды обогащения модуля */
export interface EnrichModuleCmdMeta {
  ucName: 'enrich-module';
  arMeta: ModuleArMeta;
  input: EnrichModuleCmd;
  output: Module;
  errors: EnrichModuleCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды обогащения модуля */
export type EnrichModuleCmdError =
  | ModuleAccessDeniedUcError
  | ModuleNotFoundUcError;
