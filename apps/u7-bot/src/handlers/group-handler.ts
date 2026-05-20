import type { Logger } from '@u7-scl/core/shared';
import type { UserFacade } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Bot } from 'grammy';
import type { BotContext } from '../context';

/**
 * Регистрирует обработчики событий группы.
 *
 * - `my_chat_member` — бот добавлен/удалён из группы.
 *   При добавлении — выдаёт SUBSCRIBER тому, кто добавил.
 *   При удалении — ничего не делает.
 *
 * - `chat_member` — пользователь присоединился/покинул группу
 *   (требует прав администратора в группе).
 *   При присоединении — выдаёт SUBSCRIBER.
 *   При выходе — снимает SUBSCRIBER.
 */
export function registerGroupHandlers(
  bot: Bot<BotContext>,
  userFacade: UserFacade,
  logger: Logger,
): void {
  // ══ Бот добавлен или удалён из группы ══
  bot.on('my_chat_member', async (ctx) => {
    const oldStatus = ctx.myChatMember.old_chat_member.status;
    const newStatus = ctx.myChatMember.new_chat_member.status;
    const adderId = ctx.myChatMember.from.id;

    // Бота добавили в группу → выдаём SUBSCRIBER тому, кто добавил
    if (
      oldStatus === 'left' &&
      (newStatus === 'member' || newStatus === 'administrator')
    ) {
      try {
        const user = await userFacade.getUserByTelegramId(adderId);
        if (user) {
          await userFacade.addRoleToUser(user.uuid, Role.SUBSCRIBER);
        }
      } catch (err) {
        logger.error(
          'group-handler',
          'Ошибка при выдаче SUBSCRIBER при добавлении бота в группу',
          { error: String(err), adderId },
        );
      }
    }
    // Бота удалили из группы — ничего не делаем
  });

  // ══ Пользователь присоединился или покинул группу ══
  // Требует, чтобы бот был администратором группы с правами на отслеживание
  bot.on('chat_member', async (ctx) => {
    const member = ctx.chatMember;
    const userId = member.new_chat_member.user.id;

    // Пользователь присоединился
    if (
      member.old_chat_member.status === 'left' &&
      (member.new_chat_member.status === 'member' ||
        member.new_chat_member.status === 'administrator')
    ) {
      try {
        const user = await userFacade.getUserByTelegramId(userId);
        if (user) {
          await userFacade.addRoleToUser(user.uuid, Role.SUBSCRIBER);
        }
      } catch (err) {
        logger.error(
          'group-handler',
          'Ошибка при выдаче SUBSCRIBER при входе пользователя в группу',
          { error: String(err), userId },
        );
      }
    }

    // Пользователь покинул группу
    if (
      (member.old_chat_member.status === 'member' ||
        member.old_chat_member.status === 'administrator') &&
      (member.new_chat_member.status === 'left' ||
        member.new_chat_member.status === 'kicked')
    ) {
      try {
        const user = await userFacade.getUserByTelegramId(userId);
        if (user) {
          await userFacade.removeRoleFromUser(user.uuid, Role.SUBSCRIBER);
        }
      } catch (err) {
        logger.error(
          'group-handler',
          'Ошибка при снятии SUBSCRIBER при выходе пользователя из группы',
          { error: String(err), userId },
        );
      }
    }
  });
}
