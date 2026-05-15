import { Aggregate } from '@u7/core/domain';
import { isoNow } from '@u7/core/shared';
import type { CreateUserCmd } from './commands/create-user-cmd';
import type { RegisterUserCmd } from './commands/register-user-cmd';
import type { User, UserArMeta } from './entity';
import { UserSchema } from './entity';
import { Role } from './roles';

/**
 * Агрегат пользователя.
 * Инкапсулирует состояние User и логику его изменения.
 */
export class UserAr extends Aggregate<UserArMeta> {
  static readonly arName = 'User';
  static readonly arLabel = 'Пользователь';

  constructor(state: User) {
    super(state, UserSchema);
  }

  /**
   * Фабричный метод создания нового пользователя из команды.
   */
  static create(command: CreateUserCmd): UserAr {
    const candidate: User = {
      uuid: crypto.randomUUID(),
      name: command.name,
      telegramId: command.telegramId,
      roles: command.roles,
      createdAt: isoNow(),
    };

    return new UserAr(candidate);
  }

  /**
   * Фабричный метод регистрации пользователя при первом /start в боте.
   * Создаёт пользователя с ролью GUEST.
   */
  static register(command: RegisterUserCmd): UserAr {
    const candidate: User = {
      uuid: crypto.randomUUID(),
      name: command.name,
      telegramId: command.telegramId,
      roles: [Role.GUEST],
      createdAt: isoNow(),
    };

    return new UserAr(candidate);
  }

  /**
   * Идемпотентное добавление роли.
   * Если роль уже есть — ничего не делает.
   */
  addRole(role: Role): void {
    if (!this._state.roles.includes(role)) {
      this._state.roles.push(role);
      this._state.updatedAt = isoNow();
    }
  }
}
