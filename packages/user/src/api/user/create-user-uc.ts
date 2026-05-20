import { errConflict } from '@u7-scl/core/domain';
import { UserUseCase } from '#api/user-uc';
import { UserAr } from '#domain/user/a-root';
import {
  type CreateUserCmd,
  type CreateUserCmdMeta,
  CreateUserCmdSchema,
} from '#domain/user/commands/create-user-cmd';
import type { TelegramIdTakenUcError } from '#domain/user/commands/errors';
import type { User } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';
import { UserPolicy } from '#domain/user/policy';

/**
 * Use-case создания пользователя.
 * Требует прав ADMIN.
 */
export class CreateUserUc extends UserUseCase<CreateUserCmdMeta> {
  protected readonly ucName = 'create-user' as const;
  protected readonly ucLabel = 'Создать пользователя' as const;
  protected readonly arMeta = {
    arName: UserAr.arName as 'User',
    arLabel: UserAr.arLabel as 'Пользователь',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateUserCmdSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: CreateUserCmd, actorId: string): Promise<User> {
    const repo = this.resolve.userRepo;

    const actor = await this.getActor(actorId);
    if (!UserPolicy.canCreate(actor)) {
      this.throwAccessDenied('Недостаточно прав для создания пользователя');
    }

    // Проверка уникальности telegramId
    if (await repo.isTelegramIdTaken(command.telegramId)) {
      this.throwError(
        errConflict<TelegramIdTakenUcError>(
          'TELEGRAM_ID_TAKEN',
          'Пользователь с таким telegramId уже существует',
          { telegramId: command.telegramId },
        ),
      );
    }

    const ar = UserAr.create(command);
    await repo.save(ar.state);

    return ar.state;
  }
}
