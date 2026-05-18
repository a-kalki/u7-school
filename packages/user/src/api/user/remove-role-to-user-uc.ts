import { UserUseCase } from '#api/user-uc';
import { UserAr } from '#domain/user/a-root';
import {
  type RemoveRoleToUserCmd,
  type RemoveRoleToUserCmdMeta,
  RemoveRoleToUserCmdSchema,
} from '#domain/user/commands/remove-role-to-user-cmd';
import type { User } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';
import { UserPolicy } from '#domain/user/policy';

/**
 * Use-case удаления роли у пользователя.
 * Требует прав ADMIN.
 */
export class RemoveRoleToUserUc extends UserUseCase<RemoveRoleToUserCmdMeta> {
  protected readonly ucName = 'remove-role-to-user' as const;
  protected readonly ucLabel = 'Удалить роль у пользователя' as const;
  protected readonly arMeta = {
    arName: UserAr.arName as 'User',
    arLabel: UserAr.arLabel as 'Пользователь',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = RemoveRoleToUserCmdSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: RemoveRoleToUserCmd, actorId: string): Promise<User> {
    const repo = this.resolve.userRepo;

    const actor = await this.getActor(actorId);
    if (!UserPolicy.canAddRole(actor)) {
      this.throwAccessDenied('Недостаточно прав для выполнения действия');
    }

    const target = await repo.getByUuid(command.userId);
    if (!target) {
      this.throwNotFound('USER_NOT_FOUND', 'Пользователь не найден', {
        uuid: command.userId,
      });
    }

    const ar = new UserAr(target);
    ar.removeRole(command.role);
    await repo.save(ar.state);

    return ar.state;
  }
}
