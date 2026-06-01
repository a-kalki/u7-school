import * as v from 'valibot';
import type { User, UserArMeta } from '../entity';
import { UserSchema } from '../entity';
import { RoleSchema } from '../roles';
import type { AccessDeniedUcError, UserNotFoundUcError } from './errors';

/** Схема валидации команды обновления роли пользователя */
export const UpdateUserRoleCmdSchema = v.object({
  userId: UserSchema.entries.uuid,
  role: RoleSchema,
});

/** Команда обновления роли пользователя */
export type UpdateUserRoleCmd = v.InferOutput<typeof UpdateUserRoleCmdSchema>;

/** Мета команды обновления роли пользователя */
export interface UpdateUserRoleCmdMeta {
  ucName: 'update-user-role';
  arMeta: UserArMeta;
  input: UpdateUserRoleCmd;
  output: User;
  errors: UpdateUserRoleCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды обновления роли пользователя */
export type UpdateUserRoleCmdError = UserNotFoundUcError | AccessDeniedUcError;
