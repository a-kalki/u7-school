import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { CreateUserCmd } from './commands/create-user-cmd';
import type { RegisterGuestCmd } from './commands/register-guest-cmd';
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
  static register(command: RegisterGuestCmd): UserAr {
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
    if (!this.hasRole(role)) {
      this._state.roles.push(role);
      this._state.updatedAt = isoNow();
    }
  }

  /**
   * Идемпотентное удаление роли.
   * Если роли нет — ничего не делает.
   */
  removeRole(role: Role): void {
    const idx = this._state.roles.indexOf(role);
    if (idx !== -1) {
      this._state.roles.splice(idx, 1);
      this._state.updatedAt = isoNow();
    }
  }

  /**
   * Устанавливает единственную роль пользователя.
   */
  setRole(role: Role): void {
    this._state.roles = [role];
    this._state.updatedAt = isoNow();
  }

  /**
   * Проверяет наличие роли у пользователя.
   */
  hasRole(role: Role): boolean {
    return this._state.roles.includes(role);
  }
}
