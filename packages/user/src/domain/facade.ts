import type { NotifyKind } from '@u7-scl/core/domain';
import type { User } from './user/entity';
import type { Role } from './user/roles';

/**
 * Фасад модуля пользователей для внешних модулей.
 * Предоставляет методы получения информации о пользователях,
 * не раскрывая внутреннее устройство модуля @u7-scl/user.
 *
 * actor — готовый объект актора (User): резолвится на входе приложения
 * и передаётся через appApi.execute до use-case.
 */
export interface UserFacade {
  /** Получить пользователя по UUID */
  getUserByUuid(uuid: string, actor?: User): Promise<User | undefined>;

  /** Проверить, существует ли пользователь с указанным UUID */
  userExists(uuid: string, actor?: User): Promise<boolean>;

  /** Добавить роль пользователю */
  addRoleToUser(userId: string, role: Role, actor?: User): Promise<void>;

  /** Обновить роль пользователя (заменить все роли на одну) */
  updateUserRole(userId: string, role: Role, actor?: User): Promise<void>;

  /** Получить пользователя по Telegram ID */
  getUserByTelegramId(
    telegramId: number,
    actor?: User,
  ): Promise<User | undefined>;

  /** Удалить роль у пользователя */
  removeRoleFromUser(userId: string, role: Role, actor?: User): Promise<void>;

  /** Зарегистрировать гостя по telegramId и имени (создаст, если нет) */
  registerGuest(
    telegramId: number,
    name: string,
    nick?: string,
    actor?: User,
  ): Promise<User>;

  /**
   * Уведомить пользователя — единый механизм уведомлений модуля.
   * Публикует user.notified; доставку выполняет подписчик UI-слоя.
   *
   * @param text  упрощённый markdown без экранирования: пунктуация и
   *              разметка пишутся как в обычном тексте; диалект канала —
   *              забота доставщика
   * @param kind  вид уведомления (оформление реплики транспортом);
   *              по умолчанию — notify
   */
  notify(
    userId: string,
    text: string,
    kind?: NotifyKind,
    actor?: User,
  ): Promise<void>;
}
