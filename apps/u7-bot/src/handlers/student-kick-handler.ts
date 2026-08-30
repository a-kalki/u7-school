import type { EventBus } from '@u7-scl/core/domain';
import type { Logger } from '@u7-scl/core/shared';
import type { Stream, StudentAbandonedEvent } from '@u7-scl/stream/domain';
import type { UserFacade } from '@u7-scl/user/domain';
import type { Api } from 'grammy';

const SOURCE = 'student-kick-handler';

/** Зависимости ER кика студента из Telegram-группы потока. */
export interface StudentKickHandlerDeps {
  /** Общая шина доменных событий (та же, что у ApiApp) */
  eventBus: EventBus;
  /** Маппинг streamId → поток (UC get-stream / фасад) */
  getStream: (streamId: string) => Promise<Stream | undefined>;
  /** Профиль студента (telegramId) */
  userFacade: UserFacade;
  /** Grammy Api основного бота (должен быть админом группы) */
  botApi: Api;
  logger: Logger;
}

/**
 * ER кика студента из Telegram-группы потока при уходе из учёбы (spec FR-6).
 *
 * Подписка на доменное событие student.abandoned (публикуется при
 * самовыходе drop() и снятии ментором markAbandoned()).
 *
 * Мягкое удаление: banChatMember + unbanChatMember — студент исключён,
 * но может вернуться по инвайту. Нет группы у потока, нет telegramId
 * или бот не админ → кик пропускается с записью в лог; снятие
 * с учёбы завершается успешно (ошибки не всплывают).
 *
 * @returns функцию отписки от события
 */
export function registerStudentKickHandler(
  deps: StudentKickHandlerDeps,
): () => void {
  const { eventBus, getStream, userFacade, botApi, logger } = deps;

  return eventBus.subscribe<StudentAbandonedEvent>(
    'student.abandoned',
    async (event) => {
      try {
        await kickStudentFromGroup(event, deps);
      } catch (err) {
        logger.warn(SOURCE, `Кик не выполнен: ${String(err)}`);
      }
    },
  );

  async function kickStudentFromGroup(
    event: StudentAbandonedEvent,
    { getStream, userFacade, botApi, logger }: StudentKickHandlerDeps,
  ): Promise<void> {
    const { streamId, userId } = event.payload;

    const stream = await getStream(streamId);
    if (!stream) {
      logger.warn(SOURCE, `Поток ${streamId} не найден — кик пропущен`);
      return;
    }
    if (!stream.telegramGroupId) {
      logger.warn(
        SOURCE,
        `У потока «${stream.title}» нет Telegram-группы — кик пропущен`,
      );
      return;
    }

    const user = await userFacade.getUserByUuid(userId);
    if (!user || user.telegramId === undefined) {
      logger.warn(
        SOURCE,
        `Не найден telegramId пользователя ${userId} — кик пропущен`,
      );
      return;
    }

    const groupId = stream.telegramGroupId;
    try {
      // Мягкий кик: бан на минуту и мгновенный разбан —
      // пользователь удалён из группы, но может вернуться по инвайту
      await botApi.banChatMember(groupId, user.telegramId, {
        until_date: Math.floor(Date.now() / 1000) + 60,
      });
      await botApi.unbanChatMember(groupId, user.telegramId);
      logger.info(
        SOURCE,
        `Студент ${userId} исключён из группы ${groupId} потока «${stream.title}»`,
      );
    } catch (err) {
      logger.warn(
        SOURCE,
        `Не удалось исключить из группы ${groupId} (бот не админ?): ${String(err)}`,
      );
    }
  }
}
