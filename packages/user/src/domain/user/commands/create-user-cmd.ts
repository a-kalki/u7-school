import * as v from 'valibot';
import type { User, UserArMeta } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';
import type {
  AccessDeniedUcError,
  TelegramIdTakenUcError,
  UserNotFoundUcError,
} from './errors';

/** Схема валидации команды создания пользователя */
export const CreateUserCmdSchema = v.object({
  name: UserSchema.entries.name,
  telegramId: UserSchema.entries.telegramId,
  roles: UserSchema.entries.roles,
});

/** Команда создания пользователя */
export type CreateUserCmd = v.InferOutput<typeof CreateUserCmdSchema>;

/** Мета команды создания пользователя */
export interface CreateUserCmdMeta {
  ucName: 'create-user';
  arMeta: UserArMeta;
  input: CreateUserCmd;
  output: User;
  errors: CreateUserCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды создания пользователя */
export type CreateUserCmdError =
  | UserNotFoundUcError
  | TelegramIdTakenUcError
  | AccessDeniedUcError;
