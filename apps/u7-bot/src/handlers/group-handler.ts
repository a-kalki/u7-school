import type { Logger } from '@u7-scl/core/shared';
import { escapeMarkdown } from '@u7-scl/core/shared';
import type { ProactiveSender } from '@u7-scl/core/ui';
import type { UserFacade } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Bot } from 'grammy';
import type { BotContext } from '../context';
import type { U7BotApp } from '../core/u7-bot-app-meta';

/** Дополнительные зависимости для уведомлений о выходе из группы (FR-7). */
export interface GroupHandlerDeps {
  /** ApiApp — выборка потоков и студентов (только чтение) */
  apiApp: U7BotApp;
  /** Проактивные уведомления ментору */
  transport: ProactiveSender;
}

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
 *   При выходе — снимает SUBSCRIBER и уведомляет ментора потока
 *   «Студент A покинул группу» (spec FR-7); статус студента не меняется.
 */
export function registerGroupHandlers(
  bot: Bot<BotContext>,
  userFacade: UserFacade,
  logger: Logger,
  deps?: GroupHandlerDeps,
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
          await userFacade.addRoleToUser(user.uuid, Role.SUBSCRIBER, user.uuid);
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
          // FR-7: уведомление ментору — раньше снятия роли,
          // чтобы сбой роли не блокировал уведомление
          if (deps) {
            await notifyMentorsAboutGroupLeft(
              user.uuid,
              user.name,
              String(member.chat.id),
              deps,
              logger,
            );
          }
          await userFacade.removeRoleFromUser(
            user.uuid,
            Role.SUBSCRIBER,
            user.uuid,
          );
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

/**
 * Уведомляет менторов потоков, из группы которых вышел активный студент
 * (spec FR-7): «Студент A покинул группу». Статус студента не меняется —
 * решение об уходе из учёбы принимает сам студент или ментор.
 */
async function notifyMentorsAboutGroupLeft(
  userUuid: string,
  userName: string,
  telegramGroupId: string,
  deps: GroupHandlerDeps,
  logger: Logger,
): Promise<void> {
  try {
    const streams = await deps.apiApp.execute('list-streams', {});

    for (const stream of streams) {
      if (stream.telegramGroupId !== telegramGroupId) continue;

      // Активен ли вышедший в этом потоке (active/enrolled)
      const students = await deps.apiApp.execute(
        'list-stream-students',
        { streamId: stream.uuid },
        userUuid,
      );
      const isActive = students.some(
        (s) =>
          s.userId === userUuid &&
          (s.status === 'active' || s.status === 'enrolled'),
      );
      if (!isActive) continue;

      const mentor = await deps.apiApp.execute('get-user', {
        uuid: stream.mentorId,
      });
      if (mentor.telegramId === undefined) continue;

      await deps.transport.notify(mentor.telegramId, {
        text: `🚪 Студент ${escapeMarkdown(userName)} покинул группу «${escapeMarkdown(stream.title)}»\\.`,
        parseMode: 'MarkdownV2',
      });
    }
  } catch (err) {
    logger.warn(
      'group-handler',
      `Не удалось уведомить ментора о выходе студента из группы: ${String(err)}`,
    );
  }
}
