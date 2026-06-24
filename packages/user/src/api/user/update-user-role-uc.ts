import { UserUseCase } from '#api/user-uc';
import { UserAr } from '#domain/user/a-root';
import {
  type UpdateUserRoleCmd,
  type UpdateUserRoleCmdMeta,
  UpdateUserRoleCmdSchema,
} from '#domain/user/commands/update-user-role-cmd';
import { type User, UserSchema } from '#domain/user/entity';
import { UserPolicy } from '#domain/user/policy';

/**
 * Use-case обновления роли пользователя (полная замена ролей).
 * Требует прав ADMIN.
 */
export class UpdateUserRoleUc extends UserUseCase<UpdateUserRoleCmdMeta> {
  protected readonly ucName = 'update-user-role' as const;
  protected readonly ucLabel = 'Обновить роль пользователя' as const;
  protected readonly arMeta = {
    arName: UserAr.arName as 'User',
    arLabel: UserAr.arLabel as 'Пользователь',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = UpdateUserRoleCmdSchema;
  protected readonly outputSchema = UserSchema;

  async execute(command: UpdateUserRoleCmd, actorId: string): Promise<User> {
    const repo = this.resolve.userRepo;

    const actor = await this.getActor(actorId);
    if (!UserPolicy.isAdmin(actor)) {
      this.throwAccessDenied('Недостаточно прав для выполнения действия');
    }

    const target = await repo.getByUuid(command.userId);
    if (!target) {
      this.throwNotFound('USER_NOT_FOUND', 'Пользователь не найден', {
        uuid: command.userId,
      });
    }

    const ar = new UserAr(target);
    ar.setRole(command.role);
    await repo.save(ar.state);

    return ar.state;
  }
}
