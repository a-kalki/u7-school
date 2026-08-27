import { ModuleSchema } from '@u7-scl/course/domain';
import * as v from 'valibot';
import type { WishArMeta } from '../entity';
import type {
  ModuleNotFoundUcError,
  WishAlreadyExistsUcError,
} from '../errors';

/** Схема команды создания желания пройти модуль. */
export const CreateModuleWishCmdSchema = v.object({
  moduleId: ModuleSchema.entries.uuid,
});

/** Команда создания желания пройти модуль. */
export type CreateModuleWishCmd = v.InferOutput<
  typeof CreateModuleWishCmdSchema
>;

/** Мета команды создания желания пройти модуль. */
export interface CreateModuleWishCmdMeta {
  ucName: 'create-module-wish';
  arMeta: WishArMeta;
  input: CreateModuleWishCmd;
  output: undefined;
  errors: CreateModuleWishCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды создания желания пройти модуль. */
export type CreateModuleWishCmdError =
  | ModuleNotFoundUcError
  | WishAlreadyExistsUcError;
