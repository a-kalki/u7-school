import {
  type GetUserByTelegramIdCmd,
  type GetUserByTelegramIdCmdMeta,
  GetUserByTelegramIdCmdSchema,
} from "../../domain/user/commands/get-user-by-telegram-id-cmd";
import type { User } from "../../domain/user/entity";
import { UserSchema } from "../../domain/user/entity";
import { UserUseCase } from "../user-uc";

/**
 * Use-case поиска пользователя по Telegram ID.
 * Доступно всем (checkPolicy — пустая реализация).
 */
export class GetUserByTelegramIdUc extends UserUseCase<GetUserByTelegramIdCmdMeta> {
  protected readonly commandName = "get-user-by-telegram-id" as const;
  protected readonly description = "Найти пользователя по Telegram ID" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetUserByTelegramIdCmdSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: GetUserByTelegramIdCmd): Promise<User> {
    const user = await this.resolve.userRepo.getByTelegramId(
      command.telegramId,
    );
    if (!user) {
      this.throwNotFound("USER_NOT_FOUND", "Пользователь не найден", {
        telegramId: command.telegramId,
      });
    }
    return user;
  }
}
