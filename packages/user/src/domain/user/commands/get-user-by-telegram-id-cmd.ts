import * as v from "valibot";
import type { User, UserArMeta } from "../entity";
import { UserSchema } from "../entity";
import type { UserNotFoundUcError } from "./errors";

/** Схема валидации команды поиска по Telegram ID */
export const GetUserByTelegramIdCmdSchema = v.object({
  telegramId: UserSchema.entries.telegramId,
});

/** Команда поиска пользователя по Telegram ID */
export type GetUserByTelegramIdCmd = v.InferOutput<
  typeof GetUserByTelegramIdCmdSchema
>;

/** Мета команды поиска по Telegram ID */
export interface GetUserByTelegramIdCmdMeta {
  commandName: "get-user-by-telegram-id";
  description: "Найти пользователя по Telegram ID";
  arMeta: UserArMeta;
  input: GetUserByTelegramIdCmd;
  output: User;
  errors: GetUserByTelegramIdCmdError;
  requiresAuth: false;
  type: "query";
}

/** Ошибки команды поиска по Telegram ID */
export type GetUserByTelegramIdCmdError = UserNotFoundUcError;
