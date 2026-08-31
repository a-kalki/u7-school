import type { Logger } from '@u7-scl/core/shared';
import { escapeMarkdown } from '@u7-scl/core/shared';
import type { ProactiveSender } from '@u7-scl/core/ui';
import type { UserFacade } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Bot } from 'grammy';
import type { BotContext } from '../context';
import type { U7BotApp } from '../core/u7-bot-app-meta';

/** Дополнительные зависимости групповых обработчиков. */
export interface GroupHandlerDeps {
  /** ApiApp — выборка потоков и студентов (только чтение) */
  apiApp: U7BotApp;
  /** Проактивные уведомления ментору */
  transport: ProactiveSender;
  /** uuid бота (BOT_ADMIN_UUID): системный актор для регистрации гостей
   * и операций с ролями (UC требуют ADMIN) */
  actorId: string;
  /** chat id школьной группы (SCHOOL_GROUP_ID): единственная группа,
   * события которой влияют на регистрацию гостей и роли */
  schoolGroupId: number;
}

/**
 * Регистрирует обработчики событий группы.
 *
 * - `my_chat_member` — бот добавлен/удалён из группы.
 *   При добавлении в школьную группу (deps.schoolGroupId) — выдаёт
 *   SUBSCRIBER тому, кто добавил (регистрация и выдача роли — от имени
 *   бота, deps.actorId). Остальные группы игнорируются.
 *   При удалении — ничего не делает.
 *
 * - `chat_member` — пользователь присоединился/покинул группу
 *   (требует прав администратора в группе).
 *   При присоединении к школьной группе — регистрирует нового
 *   пользователя как гостя (от имени бота, если его ещё нет в БД)
 *   и выдаёт SUBSCRIBER.
 *   При выходе — снимает SUBSCRIBER (только для школьной группы;
 *   выход из других групп на роли не влияет) и уведомляет ментора
 *   потока «Студент A покинул группу» (spec FR-7, матчится по
 *   telegramGroupId потока); статус студента не меняется.
 *   Все операции с ролями выполняются от имени бота (deps.actorId):
 *   UC add/remove-role требуют ADMIN, а гость/участник таких прав не имеет.
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

    // Бота добавили в школьную группу → выдаём SUBSCRIBER тому, кто добавил.
    // Чужие группы игнорируем: SUBSCRIBER — только для SCHOOL_GROUP_ID.
    if (
      deps &&
      ctx.myChatMember.chat.id === deps.schoolGroupId &&
      oldStatus === 'left' &&
      (newStatus === 'member' || newStatus === 'administrator')
    ) {
      try {
        let user = await userFacade.getUserByTelegramId(adderId);
        if (!user) {
          // Незнакомый добавил бота → регистрируем гостя от имени бота
          user = await userFacade.registerGuest(
            adderId,
            ctx.myChatMember.from.first_name,
            deps.actorId,
          );
        }
        if (user) {
          await userFacade.addRoleToUser(
            user.uuid,
            Role.SUBSCRIBER,
            deps.actorId,
          );
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

    // Регистрация и роли — только для школьной группы (SCHOOL_GROUP_ID)
    const isSchoolGroup =
      deps !== undefined && member.chat.id === deps.schoolGroupId;

    // Пользователь присоединился к школьной группе
    if (
      isSchoolGroup &&
      member.old_chat_member.status === 'left' &&
      (member.new_chat_member.status === 'member' ||
        member.new_chat_member.status === 'administrator')
    ) {
      try {
        let user = await userFacade.getUserByTelegramId(userId);
        if (!user) {
          // Незнакомый присоединился → регистрируем гостя от имени бота
          user = await userFacade.registerGuest(
            userId,
            member.new_chat_member.user.first_name,
            deps.actorId,
          );
        }
        if (user) {
          await userFacade.addRoleToUser(
            user.uuid,
            Role.SUBSCRIBER,
            deps.actorId,
          );
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
          // SUBSCRIBER снимается только при выходе из школьной группы
          if (isSchoolGroup) {
            await userFacade.removeRoleFromUser(
              user.uuid,
              Role.SUBSCRIBER,
              deps.actorId,
            );
          }
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
