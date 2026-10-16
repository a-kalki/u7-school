import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';
import { Routes } from '../../shared/routes';

interface MentorProfile {
  uuid: string;
  name: string;
}

/**
 * SH01: Карточка школы (Хаб «Школа»).
 *
 * Точка входа «места»: информация о школе, менторы, потоки,
 * отзывы, контакты и сообщество.
 */
export class SchoolHubStory extends U7BotUiStory {
  readonly name = 'hub';

  override async menuButtons(_actor: User): Promise<MenuButton[]> {
    return [
      {
        kind: 'callback',
        text: '🏫 Школа',
        action: this.cb('open'),
        priority: 10,
        description:
          '🏫 Школа — визитная карточка, менторы, потоки и сообщество',
      },
    ];
  }

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (action === 'open') {
      return this.#renderHub();
    }
    if (action === 'streams') {
      return { delegate: { path: Routes.stream.catalogList } };
    }
    if (action === 'reviews') {
      return { delegate: { path: this.cbFor('reviews', 'list') } };
    }

    return this.unknownCommand(action, actor, session);
  }

  async #renderHub(): Promise<DialogResponse> {
    const school = this.resolve.school;

    let mentorNames: string[] = [];
    if (school.mentors && school.mentors.length > 0) {
      try {
        const users = (await this.appApi.execute('get-users-by-ids', {
          userIds: school.mentors,
        })) as MentorProfile[];
        mentorNames = users.map((u) => u.name).filter(Boolean);
      } catch {
        // Профили менторов временно недоступны — показываем без списка
      }
    }

    const lines: MdText[] = [
      md`🏫 *${school.name}*`,
      md`${school.description}`,
    ];

    if (mentorNames.length > 0) {
      lines.push(md`Наши менторы: ${mentorNames.join(', ')}`);
    }

    const rows: KbButton[][] = [
      [this.btn('📚 Потоки', Routes.stream.catalogList)],
      [this.btn('💬 Отзывы', this.cbFor('reviews', 'list'))],
      [this.btn('ℹ️ Инфо', this.cbFor('info', 'view'))],
      [this.btnUrl('👥 Сообщество', school.communityGroup.url)],
      [buttons.mainMenu()],
    ];

    return this.screen(mdJoin(lines, '\n\n'), this.kb(rows));
  }
}
