import { UseCase } from "@u7/core";
import { Role } from "../../domain/user/roles";
import type { User } from "../../domain/user/user";
import { UserSchema } from "../../domain/user/user";
import { UserAr, type UserArMeta } from "../../domain/user/user-ar";
import type { AuthApiResolve } from "../auth-module";
import type { CreateUserCommand } from "../commands/create-user-command";
import { CreateUserCommandSchema } from "../commands/create-user-command";
import type { AuthUcErrors } from "./types";

export interface CreateUserUcMeta {
  commandName: "create-user";
  description: "Создать пользователя";
  arMeta: UserArMeta;
  input: CreateUserCommand;
  output: User;
  errors: AuthUcErrors;
  requiresAuth: false;
  type: "command";
}

export class CreateUserUc extends UseCase<CreateUserUcMeta, AuthApiResolve> {
  protected readonly commandName = "create-user" as const;
  protected readonly description = "Создать пользователя" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "command" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = CreateUserCommandSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: CreateUserCommand, _actorId?: string): Promise<User> {
    const repo = this.resolve.userRepo;

    // Bootstrap: если репозиторий пуст, первый пользователь автоматически ADMIN
    const isEmpty = await repo.isEmpty();
    if (isEmpty) {
      command = { ...command, roles: [Role.ADMIN] };
    }

    // Проверка уникальности telegramId
    if (await repo.isTelegramIdTaken(command.telegramId)) {
      this.throwConflict(
        "TELEGRAM_ID_TAKEN",
        "Пользователь с таким telegramId уже существует",
        { telegramId: command.telegramId },
      );
    }

    const ar = UserAr.create(command);
    await repo.save(ar.state);

    return ar.state;
  }
}
