import * as v from 'valibot';
import type { User, UserArMeta } from '../entity';
import { UserSchema } from '../entity';
import { RoleSchema } from '../roles';
import type { AccessDeniedUcError, UserNotFoundUcError } from './errors';

/** Схема валидации команды удаления роли у пользователя */
export const RemoveRoleToUserCmdSchema = v.object({
  userId: UserSchema.entries.uuid,
  role: RoleSchema,
});

/** Команда удаления роли у пользователя */
export type RemoveRoleToUserCmd = v.InferOutput<typeof RemoveRoleToUserCmdSchema>;

/** Мета команды удаления роли у пользователя */
export interface RemoveRoleToUserCmdMeta {
  ucName: 'remove-role-to-user';
  arMeta: UserArMeta;
  input: RemoveRoleToUserCmd;
  output: User;
  errors: RemoveRoleToUserCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды удаления роли у пользователя */
export type RemoveRoleToUserCmdError = UserNotFoundUcError | AccessDeniedUcError;
