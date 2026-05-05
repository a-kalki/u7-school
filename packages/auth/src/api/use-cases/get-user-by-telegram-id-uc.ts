import { UseCase } from "@u7/core";
import * as v from "valibot";
import type { User } from "../../domain/user/user";
import { UserSchema } from "../../domain/user/user";
import type { UserArMeta } from "../../domain/user/user-ar";
import type { AuthApiResolve } from "../auth-module";
import type { AuthUcErrors } from "./types";

const GetUserByTelegramIdInputSchema = v.object({
  telegramId: UserSchema.entries.telegramId,
});

type GetUserByTelegramIdInput = v.InferOutput<
  typeof GetUserByTelegramIdInputSchema
>;

export interface GetUserByTelegramIdUcMeta {
  commandName: "get-user-by-telegram-id";
  description: "Найти пользователя по Telegram ID";
  arMeta: UserArMeta;
  input: GetUserByTelegramIdInput;
  output: User;
  errors: AuthUcErrors;
  requiresAuth: false;
  type: "query";
}

export class GetUserByTelegramIdUc extends UseCase<
  GetUserByTelegramIdUcMeta,
  AuthApiResolve
> {
  protected readonly commandName = "get-user-by-telegram-id" as const;
  protected readonly description = "Найти пользователя по Telegram ID" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetUserByTelegramIdInputSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: GetUserByTelegramIdInput): Promise<User> {
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
