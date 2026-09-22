import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';
import { campaignProfileOf } from './campaign-profiles';

/**
 * US: Хаб «Мои отзывы» (S02) — список живых кампаний автора.
 *
 * Вход: `hub` — кнопка главного меню «💬 Отзывы» (видна при наличии живых
 * кампаний — UC `get-my-campaigns` с `onlyLives`, асинхронная проверка).
 * Экран (ui-spec 2026-09-22): абстрактное интро «что это за место» →
 * нумерованные мини-карточки кампаний (контекст судьбы по паре
 * «роль-судьба» + краткие метрики `M/K (N дн.)`) → кнопки внизу с номером
 * карточки (в Telegram кнопку нельзя приклеить к тексту — номер даёт связь).
 * Из приглашения (S01) пользователь попадает сразу в S03, минуя этот экран.
 */
export class MyReviewsStory extends U7BotUiStory {
  readonly name = 'my-reviews';

  // ── Главное меню (декларативная кнопка) ──

  override async menuButtons(actor: User): Promise<MenuButton[]> {
    const cards = await this.appApi.execute(
      'get-my-campaigns',
      { userId: actor.uuid, onlyLives: true },
      actor,
    );
    if (cards.length === 0) return [];
    return [
      {
        kind: 'callback',
        text: '💬 Отзывы',
        action: this.cb('hub'),
        priority: 25,
        description: '💬 Отзывы — расскажи об учёбе участникам потока',
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
      return this.showHub(actor);
    }
    return this.unknownCommand(action, actor, session);
  }

  /** S02: интро + нумерованные мини-карточки + кнопки с номерами. */
  async showHub(actor: User): Promise<DialogResponse> {
    const cards = await this.appApi.execute(
      'get-my-campaigns',
      { userId: actor.uuid, onlyLives: true },
      actor,
    );
    if (cards.length === 0) {
      // Гонка: окно истекло после рендера меню — та же заглушка, что и в S03
      return this.screen(
        md`⌛ Открытых окон отзывов нет — возможность появляется после завершения потока\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    }

    const titles = await this.#titlesOf(
      cards.map((c) => c.scopeId),
      actor,
    );
    const subjectIds = cards
      .filter((c) => c.myRole === 'mentor')
      .map((c) => c.subjectId);
    const names = await this.#namesOf(subjectIds, actor);

    const header: MdText = mdJoin([
      md`💬 *Мои отзывы*`,
      md``,
      md`Здесь ты можешь оставить отзывы участникам своих потоков и мероприятий\\. Это помогает людям расти, а школе — делать обучение лучше\\.`,
    ]);
    const separator = md`──────────────`;

    const blocks: MdText[] = [];
    for (const [i, card] of cards.entries()) {
      const title = titles.get(card.scopeId) ?? '';
      const subjectName = names.get(card.subjectId);
      // Тексты вида кампании (судьба потока; будущие виды — свои профили)
      const profile = campaignProfileOf(card.context);
      const metrics = `Метрики: ${card.progress.done}/${card.progress.total} (${card.daysLeft} дн.)`;
      blocks.push(
        mdJoin([
          i > 0 ? separator : md``,
          md`${i + 1}\\. *${profile.hubCardTitle(title)}*`,
          md`${profile.hubCardText(card, subjectName)}`,
          md`${metrics}`,
        ]),
      );
    }

    const rows = cards.map((card, i) => {
      const profile = campaignProfileOf(card.context);
      return [
        this.btn(
          card.myRole === 'mentor'
            ? profile.hubMentorBtn(i + 1, names.get(card.subjectId))
            : profile.hubSubjectBtn(i + 1, titles.get(card.scopeId) ?? ''),
          this.cbFor('campaign', 'list', card.campaignId),
        ),
      ];
    });
    rows.push([buttons.mainMenu()]);

    return this.screen(mdJoin([header, md``, ...blocks]), this.kb(rows));
  }

  /** Названия потоков по scopeId карточек. */
  async #titlesOf(
    scopeIds: string[],
    actor: User,
  ): Promise<Map<string, string>> {
    const titles = new Map<string, string>();
    for (const scopeId of scopeIds) {
      const stream = await this.appApi.execute(
        'get-stream',
        { streamId: scopeId },
        actor,
      );
      titles.set(scopeId, stream.title);
    }
    return titles;
  }

  /** Имена субъектов (для менторских карточек) — один batch-запрос. */
  async #namesOf(userIds: string[], actor: User): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    if (userIds.length === 0) return names;
    const users = await this.appApi.execute(
      'get-users-by-ids',
      { userIds },
      actor,
    );
    for (const user of users) {
      names.set(user.uuid, user.name);
    }
    return names;
  }
}
