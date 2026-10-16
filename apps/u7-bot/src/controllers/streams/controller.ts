import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { getGlobalLogger, md } from '@u7-scl/core/shared';
import type { MessengerEvent, MessengerEventReaction } from '@u7-scl/core/ui';
import {
  type Student,
  StudentAr,
  StudentOutcomeCategory,
} from '@u7-scl/stream';
import { InactivityStory } from './stories/inactivity.story';
import { CatalogStory } from './stories/stream-catalog.story';
import { ViewStreamStory } from './stories/view-stream.story';

function isStudentInProgress(studentState: unknown): boolean {
  try {
    return (
      new StudentAr(studentState as Student).outcomeCategory() ===
      StudentOutcomeCategory.IN_PROGRESS
    );
  } catch {
    const raw = studentState as { status?: string };
    return raw?.status === 'active' || raw?.status === 'enrolled';
  }
}

/**
 * Контроллер streams — «Потоки курсов» (S01-S04).
 *
 * Тонкий реестр — делегирует все действия в U7BotUiStory.
 * Содержит стори: catalog (S01), view-stream (S02-S04)
 * и inactivity (уведомления о бездействии и уходе из учёбы).
 * S11 (приглашение желающих) — ER invite-wishers (userFacade.notify).
 */
export class StreamsController extends U7BotController {
  readonly name = 'stream';

  protected override readonly stories = [
    new CatalogStory(),
    new ViewStreamStory(),
    new InactivityStory(),
  ];

  /**
   * Реакция на события студенческих групп потоков (FR-7).
   */
  override async handleMessengerEvent(
    event: MessengerEvent,
  ): Promise<MessengerEventReaction | undefined> {
    try {
      const streams = await this.resolve.appApi.execute('list-streams', {});
      const stream = streams.find(
        (s) =>
          s.telegramGroupId &&
          String(s.telegramGroupId) === String(event.chatId),
      );
      if (!stream) {
        return 'pass';
      }

      if (event.kind === 'member_joined') {
        const students = await this.resolve.appApi.execute(
          'list-stream-students',
          { streamId: stream.uuid },
        );
        const user = await this.resolve.userFacade.getUserByTelegramId(
          event.user.id,
        );

        const isStudentActive =
          Boolean(user) &&
          students.some(
            (s: { userId?: string }) =>
              s.userId === user?.uuid && isStudentInProgress(s),
          );

        if (!isStudentActive) {
          const mentor = await this.resolve.appApi.execute('get-user', {
            uuid: stream.mentorId,
          });
          if (mentor?.telegramId && this.proactiveSender) {
            const userName = user?.name ?? event.user.firstName;
            const usernamePart = event.user.username
              ? ` (@${event.user.username})`
              : '';
            await this.proactiveSender.notify(mentor.telegramId, {
              text: md`⚠️ В группу «${stream.title}» вступил неизвестный участник: ${userName}${usernamePart}\\. Он не числится студентом этого потока\\.`,
            });
          }
        }
        return 'stop';
      }

      if (event.kind === 'member_left') {
        const user = await this.resolve.userFacade.getUserByTelegramId(
          event.user.id,
        );
        if (user) {
          const students = await this.resolve.appApi.execute(
            'list-stream-students',
            { streamId: stream.uuid },
          );
          const isActive = students.some(
            (s: { userId?: string }) =>
              s.userId === user.uuid && isStudentInProgress(s),
          );
          if (isActive) {
            const mentor = await this.resolve.appApi.execute('get-user', {
              uuid: stream.mentorId,
            });
            if (mentor?.telegramId && this.proactiveSender) {
              await this.proactiveSender.notify(mentor.telegramId, {
                text: md`🚪 Студент ${user.name} покинул группу «${stream.title}»\\.`,
              });
            }
          }
        }
        return 'stop';
      }

      return 'stop';
    } catch (err) {
      getGlobalLogger()?.warn(
        'stream-controller',
        `Ошибка при обработке события студенческой группы потока: ${String(err)}`,
        { event },
      );
      return 'stop';
    }
  }
}
