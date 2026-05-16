import * as v from 'valibot';
import type { User, UserArMeta } from '../entity';
import { UserSchema } from '../entity';
import { RoleSchema } from '../roles';

/** Схема команды */
export const EnsureUserWithRoleCmdSchema = v.object({
  telegramId: UserSchema.entries.telegramId,
  role: RoleSchema,
});

export type EnsureUserWithRoleCmd = v.InferOutput<
  typeof EnsureUserWithRoleCmdSchema
>;

/** Мета команды */
export interface EnsureUserWithRoleCmdMeta {
  ucName: 'ensure-user-with-role';
  arMeta: UserArMeta;
  input: EnsureUserWithRoleCmd;
  output: User;
  errors: never;
  requiresAuth: false;
  type: 'command';
}
