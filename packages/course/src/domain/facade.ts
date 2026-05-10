import type { User } from "@u7/user/domain";

/**
 * Фасад модуля пользователей для модуля курсов.
 * Предоставляет методы получения информации о пользователях,
 * не раскрывая внутреннее устройство модуля @u7/user.
 */
export interface UserFacade {
  /** Получить пользователя по UUID */
  getUserByUuid(uuid: string): Promise<User | undefined>;

  /** Проверить, существует ли пользователь с указанным UUID */
  userExists(uuid: string): Promise<boolean>;
}
