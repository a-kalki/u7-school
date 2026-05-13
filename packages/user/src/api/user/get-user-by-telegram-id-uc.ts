import { errNotFound } from "@u7/core/domain";
import { UserAr } from "#domain/user/a-root";
import type { UserNotFoundUcError } from "#domain/user/commands/errors";
import {
  type GetUserByTelegramIdCmd,
  type GetUserByTelegramIdCmdMeta,
  GetUserByTelegramIdCmdSchema,
} from "#domain/user/commands/get-user-by-telegram-id-cmd";
import type { User } from "#domain/user/entity";
import { UserSchema } from "#domain/user/entity";
import { UserUseCase } from "#api/user-uc";

/**
 * Use-case поиска пользователя по Telegram ID.
 * Доступно всем (checkPolicy — пустая реализация).
 */
export class GetUserByTelegramIdUc extends UserUseCase<GetUserByTelegramIdCmdMeta> {
  protected readonly ucName = "get-user-by-telegram-id" as const;
  protected readonly ucLabel = "Найти пользователя по Telegram ID" as const;
  protected readonly arMeta = { arName: UserAr.arName as "User", arLabel: UserAr.arLabel as "Пользователь" };
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetUserByTelegramIdCmdSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: GetUserByTelegramIdCmd): Promise<User> {
    const user = await this.resolve.userRepo.getByTelegramId(
      command.telegramId,
    );
    if (!user) {
      this.throwError(errNotFound<UserNotFoundUcError>("USER_NOT_FOUND", "Пользователь не найден", {
        telegramId: command.telegramId,
      }));
    }
    return user;
  }
}
