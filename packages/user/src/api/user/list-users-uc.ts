import * as v from "valibot";
import {
  type ListUsersCmdMeta,
  ListUsersCmdSchema,
} from "#domain/user/commands/list-users-cmd";
import type { User } from "#domain/user/entity";
import { UserSchema } from "#domain/user/entity";
import { UserUseCase } from "#api/user-uc";

/**
 * Use-case получения списка всех пользователей.
 * Доступно всем (checkPolicy — пустая реализация).
 */
export class ListUsersUc extends UserUseCase<ListUsersCmdMeta> {
  protected readonly commandName = "list-users" as const;
  protected readonly description = "Список всех пользователей" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = ListUsersCmdSchema;
  protected readonly outputSchema = v.array(UserSchema);

  async execute(): Promise<User[]> {
    return this.resolve.userRepo.getAll();
  }
}
