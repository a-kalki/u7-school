import { Aggregate, isoNow } from "@u7/core";
import type { CreateUserCommand } from "../../api/commands/create-user-command";
import type { User } from "./user";
import { UserSchema } from "./user";

/** Метаданные агрегата пользователя */
export interface UserArMeta {
  name: "user";
  label: "Пользователь";
  errors: never;
  state: User;
}

/**
 * Агрегат пользователя.
 * Инкапсулирует состояние User и логику его изменения.
 */
export class UserAr extends Aggregate<UserArMeta> {
  constructor(state: User) {
    super(state, UserSchema);
  }

  /**
   * Фабричный метод создания нового пользователя из команды.
   */
  static create(command: CreateUserCommand): UserAr {
    const candidate: User = {
      uuid: crypto.randomUUID(),
      name: command.name,
      telegramId: command.telegramId,
      roles: command.roles,
      createdAt: isoNow(),
    };

    return new UserAr(candidate);
  }
}
