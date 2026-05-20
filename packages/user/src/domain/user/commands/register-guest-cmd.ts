import type { AccessDeniedError } from '@u7-scl/core/domain';
import * as v from 'valibot';
import type { User, UserArMeta } from '../entity';
import { UserSchema } from '../entity';

/** Схема команды */
export const RegisterGuestCmdSchema = v.object({
  telegramId: UserSchema.entries.telegramId,
  name: UserSchema.entries.name,
});

export type RegisterGuestCmd = v.InferOutput<typeof RegisterGuestCmdSchema>;

/** Мета команды */
export interface RegisterGuestCmdMeta {
  ucName: 'register-guest';
  arMeta: UserArMeta;
  input: RegisterGuestCmd;
  output: User;
  errors: AccessDeniedError;
  requiresAuth: true;
  type: 'command';
}
