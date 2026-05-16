import { UserAr } from '#domain/user/a-root';
import {
  type EnsureUserWithRoleCmd,
  type EnsureUserWithRoleCmdMeta,
  EnsureUserWithRoleCmdSchema,
} from '#domain/user/commands/ensure-user-with-role-cmd';
import type { User } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';
import { UserUseCase } from '../user-uc';

export class EnsureUserWithRoleUc extends UserUseCase<EnsureUserWithRoleCmdMeta> {
  protected readonly ucName = 'ensure-user-with-role' as const;
  protected readonly ucLabel = 'Убедиться в наличии пользователя с ролью' as const;
  protected readonly arMeta = {
    arName: 'User' as const,
    arLabel: 'Пользователь' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = EnsureUserWithRoleCmdSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: EnsureUserWithRoleCmd): Promise<User> {
    const existing = await this.resolve.userRepo.getByTelegramId(
      command.telegramId,
    );

    let ar: UserAr;
    if (existing) {
      ar = new UserAr(existing);
    } else {
      ar = UserAr.register({
        name: 'Guest',
        telegramId: command.telegramId,
      });
    }

    if (!ar.hasRole(command.role)) {
      ar.addRole(command.role);
    }

    await this.resolve.userRepo.save(ar.state);
    return ar.state;
  }
}
