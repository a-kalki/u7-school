import * as v from "valibot";
import type { User, UserArMeta } from "../entity";
import { UserSchema } from "../entity";
import type {
  AccessDeniedUcError,
  BootstrapRequiresAdminUcError,
  TelegramIdTakenUcError,
  UserNotFoundUcError,
} from "./errors";

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
  commandName: "create-user";
  description: "Создать пользователя";
  arMeta: UserArMeta;
  input: CreateUserCmd;
  output: User;
  errors: CreateUserCmdError;
  requiresAuth: false;
  type: "command";
}

/** Ошибки команды создания пользователя */
export type CreateUserCmdError =
  | UserNotFoundUcError
  | TelegramIdTakenUcError
  | BootstrapRequiresAdminUcError
  | AccessDeniedUcError;
