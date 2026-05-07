import {
  type GetUserCmd,
  type GetUserCmdMeta,
  GetUserCmdSchema,
} from "../../domain/user/commands/get-user-cmd";
import type { User } from "../../domain/user/entity";
import { UserSchema } from "../../domain/user/entity";
import { UserUseCase } from "../user-uc";

/**
 * Use-case получения пользователя по UUID.
 * Доступно всем (checkPolicy — пустая реализация).
 */
export class GetUserUc extends UserUseCase<GetUserCmdMeta> {
  protected readonly commandName = "get-user" as const;
  protected readonly description = "Получить пользователя по UUID" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetUserCmdSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: GetUserCmd): Promise<User> {
    return this.getUser(command.uuid);
  }
}
