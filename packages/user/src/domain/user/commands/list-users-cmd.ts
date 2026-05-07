import * as v from "valibot";
import type { User, UserArMeta } from "#domain/user/entity";

/** Схема валидации команды списка пользователей */
export const ListUsersCmdSchema = v.object({});

/** Команда списка пользователей */
export type ListUsersCmd = Record<string, never>;

/** Мета команды списка пользователей */
export interface ListUsersCmdMeta {
  commandName: "list-users";
  description: "Список всех пользователей";
  arMeta: UserArMeta;
  input: ListUsersCmd;
  output: User[];
  errors: ListUsersCmdError;
  requiresAuth: false;
  type: "query";
}

/** Ошибки команды списка пользователей */
export type ListUsersCmdError = never;
