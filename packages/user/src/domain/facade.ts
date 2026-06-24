import type { User } from './user/entity';
import type { Role } from './user/roles';

/**
 * Фасад модуля пользователей для внешних модулей.
 * Предоставляет методы получения информации о пользователях,
 * не раскрывая внутреннее устройство модуля @u7-scl/user.
 */
export interface UserFacade {
  /** Получить пользователя по UUID */
  getUserByUuid(uuid: string, actorId?: string): Promise<User | undefined>;

  /** Проверить, существует ли пользователь с указанным UUID */
  userExists(uuid: string, actorId?: string): Promise<boolean>;

  /** Добавить роль пользователю */
  addRoleToUser(userId: string, role: Role, actorId?: string): Promise<void>;

  /** Обновить роль пользователя (заменить все роли на одну) */
  updateUserRole(userId: string, role: Role, actorId?: string): Promise<void>;

  /** Получить пользователя по Telegram ID */
  getUserByTelegramId(
    telegramId: number,
    actorId?: string,
  ): Promise<User | undefined>;

  /** Удалить роль у пользователя */
  removeRoleFromUser(
    userId: string,
    role: Role,
    actorId?: string,
  ): Promise<void>;

  /** Зарегистрировать гостя по telegramId и имени (создаст, если нет) */
  registerGuest(
    telegramId: number,
    name: string,
    actorId?: string,
  ): Promise<User>;
}
