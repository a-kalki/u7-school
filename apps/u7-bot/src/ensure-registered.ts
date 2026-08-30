import type { UserFacade } from '@u7-scl/user/domain';

/** Данные отправителя из Telegram, достаточные для регистрации гостя. */
export interface TgSender {
  id: number;
  first_name: string;
  username?: string;
}

/**
 * Регистрирует гостя, если его ещё нет в БД (сценарии /start и входа в группу).
 *
 * UC 'register-guest' требует роль ADMIN, поэтому вызов выполняется от имени
 * бота (actorId = BOT_ADMIN_UUID): бот выступает системным актором. Ослаблять
 * политику UC нельзя — после выноса API в web это открыло бы анонимную
 * регистрацию.
 *
 * Идемпотентно: существующий пользователь возвращается из БД без изменений
 * (это же гарантирует сам UC).
 */
export async function ensureRegisteredGuest(
  userFacade: UserFacade,
  actorId: string,
  sender: TgSender,
): Promise<void> {
  const existing = await userFacade.getUserByTelegramId(sender.id);
  if (existing) return;
  await userFacade.registerGuest(
    sender.id,
    sender.first_name,
    actorId,
    sender.username,
  );
}
