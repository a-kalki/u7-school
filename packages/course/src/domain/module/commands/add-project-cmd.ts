import * as v from 'valibot';
import type { Module, ModuleArMeta } from '../entity';
import { ModuleSchema, ProjectSchema } from '../entity';
import type {
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from './errors';

/** Схема валидации команды добавления проекта в модуль */
export const AddProjectCmdSchema = v.object({
  moduleId: ModuleSchema.entries.uuid,
  title: ProjectSchema.entries.title,
  goal: ProjectSchema.entries.goal,
  result: ProjectSchema.entries.result,
  additional: ProjectSchema.entries.additional,
});

/** Команда добавления проекта в модуль */
export type AddProjectCmd = v.InferOutput<typeof AddProjectCmdSchema>;

/** Мета команды добавления проекта */
export interface AddProjectCmdMeta {
  ucName: 'add-project';
  arMeta: ModuleArMeta;
  input: AddProjectCmd;
  output: Module;
  errors: AddProjectCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды добавления проекта */
export type AddProjectCmdError =
  | ModuleAccessDeniedUcError
  | ModuleNotFoundUcError;
