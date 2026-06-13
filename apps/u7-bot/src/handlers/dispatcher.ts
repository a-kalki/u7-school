import type { Logger } from '@u7-scl/core/shared';
import type { User, UserFacade } from '@u7-scl/user/domain';

/**
 * Резолвит пользователя по telegramId.
 * Если пользователь не найден — регистрирует гостя.
 *
 * @param userFacade — фасад модуля пользователей
 * @param telegramId — Telegram ID пользователя
 * @param botAdminUuid — UUID администратора (для registerGuest)
 * @param name — имя пользователя (по умолчанию «Гость»)
 * @returns объект User
 */
export async function resolveUser(
  userFacade: UserFacade,
  telegramId: number,
  botAdminUuid: string,
  name?: string,
): Promise<User> {
  const existing = await userFacade.getUserByTelegramId(telegramId);
  if (existing) {
    return existing;
  }
  return userFacade.registerGuest(telegramId, name ?? 'Гость', botAdminUuid);
}
