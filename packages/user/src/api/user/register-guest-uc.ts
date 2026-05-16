import { UserAr } from '#domain/user/a-root';
import {
  type RegisterGuestCmd,
  type RegisterGuestCmdMeta,
  RegisterGuestCmdSchema,
} from '#domain/user/commands/register-guest-cmd';
import type { User } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';
import { Role } from '#domain/user/roles';
import { UserUseCase } from '../user-uc';

/**
 * Регистрация нового пользователя с ролью GUEST.
 * Если пользователь уже существует, возвращает его текущее состояние без изменений.
 */
export class RegisterGuestUc extends UserUseCase<RegisterGuestCmdMeta> {
  protected readonly ucName = 'register-guest' as const;
  protected readonly ucLabel = 'Зарегистрировать гостя' as const;
  protected readonly arMeta = {
    arName: 'User' as const,
    arLabel: 'Пользователь' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = RegisterGuestCmdSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: RegisterGuestCmd, actorId: string): Promise<User> {
    const actor = await this.getActor(actorId);
    if (!actor.roles.includes(Role.ADMIN)) {
      this.throwAccessDenied(
        'Только администратор может регистрировать гостей',
      );
    }

    const existing = await this.resolve.userRepo.getByTelegramId(
      command.telegramId,
    );

    if (existing) {
      return existing;
    }

    const ar = UserAr.register({
      name: command.name,
      telegramId: command.telegramId,
    });

    await this.resolve.userRepo.save(ar.state);
    return ar.state;
  }
}
