import * as v from 'valibot';
import type { ModuleArMeta } from '../entity';
import { ModuleSchema } from '../entity';
import type {
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from './errors';
import type { ContentSnapshot } from '../../types';

/** Схема валидации команды получения снимка модуля */
export const GetModuleSnapshotCmdSchema = v.object({
  moduleId: ModuleSchema.entries.uuid,
});

/** Команда получения снимка модуля */
export type GetModuleSnapshotCmd = v.InferOutput<
  typeof GetModuleSnapshotCmdSchema
>;

/** Мета команды получения снимка модуля */
export interface GetModuleSnapshotCmdMeta {
  ucName: 'get-module-snapshot';
  arMeta: ModuleArMeta;
  input: GetModuleSnapshotCmd;
  output: ContentSnapshot;
  errors: GetModuleSnapshotCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды получения снимка модуля */
export type GetModuleSnapshotCmdError =
  | ModuleAccessDeniedUcError
  | ModuleNotFoundUcError;
