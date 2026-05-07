import * as v from "valibot";
import type { User, UserArMeta } from "#domain/user/entity";
import type { Role } from "#domain/user/roles";

/** Допустимые роли для фильтрации */
const RoleSchema = v.picklist(["Admin", "Mentor", "Student"] as const);

/** Поля для сортировки */
const SortFieldSchema = v.picklist(["createdAt", "name"] as const);

/** Направление сортировки */
const SortDirSchema = v.picklist(["asc", "desc"] as const);

/** Схема валидации команды списка пользователей */
export const ListUsersCmdSchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 20),
  role: v.optional(RoleSchema),
  name: v.optional(v.string()),
  telegramId: v.optional(v.number()),
  sort: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^(createdAt|name):(asc|desc)$/),
    ),
    "createdAt:desc",
  ),
});

/** Входные данные команды списка пользователей */
export type ListUsersCmd = v.InferInput<typeof ListUsersCmdSchema>;

/** Отфильтрованный результат */
export interface ListUsersResult {
  users: User[];
  total: number;
  appliedFilters: {
    limit: number;
    role?: Role;
    name?: string;
    telegramId?: number;
    sort: string;
  };
}

/** Мета команды списка пользователей */
export interface ListUsersCmdMeta {
  commandName: "list-users";
  description: "Список всех пользователей с фильтрацией";
  arMeta: UserArMeta;
  input: ListUsersCmd;
  output: ListUsersResult;
  errors: ListUsersCmdError;
  requiresAuth: false;
  type: "query";
}

/** Ошибки команды списка пользователей */
export type ListUsersCmdError = never;
