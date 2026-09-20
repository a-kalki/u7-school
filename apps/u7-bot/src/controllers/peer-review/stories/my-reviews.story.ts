import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { md } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';

/**
 * US: Хаб «Мои отзывы» (S02) — список живых кампаний автора.
 *
 * Вход: `my-reviews` — кнопка главного меню «💬 Отзывы» (видна при наличии
 * живых кампаний — асинхронная проверка фасадом `hasLiveCampaigns`).
 * Экран: карточка на кампанию с рендером по `myRole` (субъекту — «одногруппники
 * и ментор» + прогресс M/K, ментору — «отзыв о {Имя}»); выбор кампании — мост
 * в стори campaign (S03). Экран списка — задача следующая (S02), пока — заглушка.
 */
export class MyReviewsStory extends U7BotUiStory {
  readonly name = 'my-reviews';

  // ── Главное меню (декларативная кнопка) ──

  override async menuButtons(actor: User): Promise<MenuButton[]> {
    const hasLive = await this.resolver.peerReviewFacade.hasLiveCampaigns(
      actor.uuid,
    );
    if (!hasLive) return [];
    return [
      {
        kind: 'callback',
        text: '💬 Отзывы',
        action: this.cb('hub'),
        priority: 25,
        description: '💬 Отзывы — о ком можно рассказать после потока',
      },
    ];
  }

  // ── Callback ──

  override async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (action === 'hub') {
      // S02 — экран списка кампаний (следующая задача Фазы 2)
      return this.screen(md`💬 *Мои отзывы*`, this.kb([[buttons.mainMenu()]]));
    }
    return this.unknownCommand(action, actor, session);
  }
}
