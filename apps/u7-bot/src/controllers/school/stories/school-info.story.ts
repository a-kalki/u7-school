import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';

/**
 * SH02: Экран «Инфо» школы.
 *
 * Полная информация о школе: имя, описание, адрес,
 * контакты (телефон, сайт или заглушка).
 */
export class SchoolInfoStory extends U7BotUiStory {
  readonly name = 'info';

  override async menuButtons(_actor: User): Promise<MenuButton[]> {
    return [];
  }

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (action === 'view') {
      return this.#renderInfo();
    }

    return this.unknownCommand(action, actor, session);
  }

  #renderInfo(): DialogResponse {
    const school = this.resolve.school;

    const siteText = school.contacts.site
      ? school.contacts.site
      : 'сайта пока нет, но скоро будет';

    const lines: MdText[] = [
      md`🏫 *${school.name}*`,
      md`${school.description}`,
      md`📍 *Адрес:* ${school.address}`,
      md`📞 *Телефон:* ${school.contacts.phone}`,
      md`🌐 *Сайт:* ${siteText}`,
    ];

    const rows: KbButton[][] = [
      [this.btn('⬅️ Назад в школу', this.cbFor('hub', 'open'))],
    ];

    return this.screen(mdJoin(lines, '\n\n'), this.kb(rows));
  }
}
