import { UserAr } from "../../domain/user/a-root";
import {
  type CreateUserCmd,
  type CreateUserCmdMeta,
  CreateUserCmdSchema,
} from "../../domain/user/commands/create-user-cmd";
import type { User } from "../../domain/user/entity";
import { UserSchema } from "../../domain/user/entity";
import { UserPolicy } from "../../domain/user/policy";
import { Role } from "../../domain/user/roles";
import { UserUseCase } from "../user-uc";

/**
 * Use-case создания пользователя.
 * Требует прав ADMIN (кроме bootstrap — первый пользователь при пустом репозитории,
 * но даже в bootstrap первый пользователь обязан иметь роль ADMIN в команде).
 */
export class CreateUserUc extends UserUseCase<CreateUserCmdMeta> {
  protected readonly commandName = "create-user" as const;
  protected readonly description = "Создать пользователя" as const;
  protected readonly arName = "user" as const;
  protected readonly arLabel = "Пользователь" as const;
  protected readonly type = "command" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = CreateUserCmdSchema;
  protected readonly outputSchema = UserSchema;

  /**
   * Проверка прав на создание пользователя.
   * Только ADMIN может создавать пользователей.
   */
  protected override async checkPolicy(
    _command: CreateUserCmd,
    actor: User,
  ): Promise<void> {
    if (!UserPolicy.canCreate(actor)) {
      this.throwAccessDenied(
        "ACCESS_DENIED",
        "Недостаточно прав для создания пользователя",
      );
    }
  }

  async execute(command: CreateUserCmd, actorId?: string): Promise<User> {
    const repo = this.resolve.userRepo;
    const isEmpty = await repo.isEmpty();

    if (isEmpty) {
      // Bootstrap: первый пользователь обязан иметь роль ADMIN
      if (!command.roles.includes(Role.ADMIN)) {
        this.throwConflict(
          "BOOTSTRAP_REQUIRES_ADMIN",
          "Первый пользователь должен иметь роль ADMIN",
        );
      }
    } else {
      // Репозиторий не пуст — требуется авторизованный ADMIN
      if (!actorId) {
        this.throwAccessDenied(
          "ACCESS_DENIED",
          "Требуется авторизация для создания пользователя",
        );
      }
      const actor = await this.getUser(actorId);
      await this.checkPolicy(command, actor);
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
