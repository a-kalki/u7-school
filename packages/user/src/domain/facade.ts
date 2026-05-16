import type { User } from './user/entity';
import type { Role } from './user/roles';

/**
 * Фасад модуля пользователей для внешних модулей.
 * Предоставляет методы получения информации о пользователях,
 * не раскрывая внутреннее устройство модуля @u7/user.
 */
export interface UserFacade {
  /** Получить пользователя по UUID */
  getUserByUuid(uuid: string, actorId?: string): Promise<User | undefined>;

  /** Проверить, существует ли пользователь с указанным UUID */
  userExists(uuid: string, actorId?: string): Promise<boolean>;

  /** Добавить роль пользователю */
  addRoleToUser(
    userId: string,
    role: Role,
    actorId?: string,
  ): Promise<User | undefined>;

  /** Убедиться, что существует пользователь с указанным telegramId и ролью (создаст, если нет) */
  ensureUserWithRole(
    telegramId: number,
    role: Role,
  ): Promise<void>;
}
