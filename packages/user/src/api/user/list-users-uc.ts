import * as v from "valibot";
import { UserUseCase } from "#api/user-uc";
import { UserAr } from "#domain/user/a-root";
import { RoleSchema } from "#domain/index";
import {
  type ListUsersCmd,
  type ListUsersCmdMeta,
  ListUsersCmdSchema,
  type ListUsersResult,
} from "#domain/user/commands/list-users-cmd";
import type { User } from "#domain/user/entity";
import { UserSchema } from "#domain/user/entity";

/**
 * Use-case получения списка пользователей с фильтрацией и сортировкой.
 * Доступно всем (checkPolicy — пустая реализация).
 */
export class ListUsersUc extends UserUseCase<ListUsersCmdMeta> {
  protected readonly ucName = "list-users" as const;
  protected readonly ucLabel =
    "Список всех пользователей с фильтрацией" as const;
  protected readonly arMeta = { arName: UserAr.arName as "User", arLabel: UserAr.arLabel as "Пользователь" };
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ListUsersCmdSchema;
  protected readonly outputSchema = v.object({
    users: v.array(UserSchema),
    total: v.number(),
    appliedFilters: v.object({
      limit: v.number(),
      role: v.optional(RoleSchema),
      name: v.optional(v.string()),
      telegramId: v.optional(v.number()),
      sort: v.string(),
    }),
  });

  async execute(cmd: ListUsersCmd): Promise<ListUsersResult> {
    const users = await this.resolve.userRepo.getAll({
      limit: cmd.limit,
      role: cmd.role as User["roles"][number] | undefined,
      name: cmd.name,
      telegramId: cmd.telegramId,
      sort: cmd.sort,
    });

    return {
      users,
      total: users.length,
      appliedFilters: {
        limit: cmd.limit ?? 20,
        role: cmd.role as User["roles"][number] | undefined,
        name: cmd.name,
        telegramId: cmd.telegramId,
        sort: cmd.sort ?? "createdAt:desc",
      },
    };
  }
}
