import * as v from 'valibot';
import type { User, UserArMeta } from '../entity';
import { UserSchema } from '../entity';
import { RoleSchema } from '../roles';
import type { AccessDeniedUcError, UserNotFoundUcError } from './errors';

/** Схема валидации команды добавления роли пользователю */
export const AddRoleToUserCmdSchema = v.object({
  userId: UserSchema.entries.uuid,
  role: RoleSchema,
});

/** Команда добавления роли пользователю */
export type AddRoleToUserCmd = v.InferOutput<typeof AddRoleToUserCmdSchema>;

/** Мета команды добавления роли пользователю */
export interface AddRoleToUserCmdMeta {
  ucName: 'add-role-to-user';
  arMeta: UserArMeta;
  input: AddRoleToUserCmd;
  output: User;
  errors: AddRoleToUserCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды добавления роли пользователю */
export type AddRoleToUserCmdError = UserNotFoundUcError | AccessDeniedUcError;
