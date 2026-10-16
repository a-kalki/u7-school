import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { getGlobalLogger } from '@u7-scl/core/shared';
import type { MessengerEvent, MessengerEventReaction } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { CommunityStory } from './stories/community.story';
import { SchoolHubStory } from './stories/school-hub.story';
import { SchoolInfoStory } from './stories/school-info.story';
import { SchoolReviewsStory } from './stories/school-reviews.story';

/**
 * Контроллер school — хаб «🏫 Школа».
 *
 * Тонкий реестр — делегирует действия в свои стори:
 * - SchoolHubStory (визитная карточка SH01)
 * - SchoolInfoStory (экран «Инфо» SH02)
 * - SchoolReviewsStory (экран «Отзывы» SH03)
 * - CommunityStory (сообщество школы)
 */
export class SchoolController extends U7BotController {
  readonly name = 'school';

  protected override readonly stories = [
    new SchoolHubStory(),
    new SchoolInfoStory(),
    new SchoolReviewsStory(),
    new CommunityStory(),
  ];

  /**
   * Реакция на события школьной группы (FR-7).
   * Выдаёт роль SUBSCRIBER при входе в группу сообщества школы,
   * снимает её при выходе.
   */
  override async handleMessengerEvent(
    event: MessengerEvent,
  ): Promise<MessengerEventReaction | undefined> {
    const isSchoolGroup =
      String(event.chatId) === String(this.resolve.school.communityGroup.id);
    if (!isSchoolGroup) {
      return 'pass';
    }

    try {
      if (event.kind === 'bot_membership') {
        if (event.status === 'added' && event.byUser) {
          const user = await this.resolve.userFacade.getUserByTelegramId(
            event.byUser.id,
          );
          if (user) {
            await this.resolve.userFacade.addRoleToUser(
              user.uuid,
              Role.SUBSCRIBER,
              this.resolve.botAdminUser,
            );
          }
        }
        return 'stop';
      }

      if (event.kind === 'member_joined') {
        const user = await this.resolve.userFacade.getUserByTelegramId(
          event.user.id,
        );
        if (user) {
          await this.resolve.userFacade.addRoleToUser(
            user.uuid,
            Role.SUBSCRIBER,
            this.resolve.botAdminUser,
          );
        }
        return 'stop';
      }

      if (event.kind === 'member_left') {
        const user = await this.resolve.userFacade.getUserByTelegramId(
          event.user.id,
        );
        if (user) {
          await this.resolve.userFacade.removeRoleFromUser(
            user.uuid,
            Role.SUBSCRIBER,
            this.resolve.botAdminUser,
          );
        }
        return 'stop';
      }
    } catch (err) {
      getGlobalLogger()?.warn(
        'school-controller',
        `Ошибка при обработке события школьной группы: ${String(err)}`,
        { event },
      );
      return 'stop';
    }

    return 'stop';
  }
}
