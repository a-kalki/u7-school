import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';

/**
 * US: Хаб «Мои отзывы» (S02) — список живых кампаний автора.
 *
 * Вход: `hub` — кнопка главного меню «💬 Отзывы» (видна при наличии живых
 * кампаний — UC `get-my-campaigns` с `onlyLives`, асинхронная проверка).
 * Экран: нумерованная строка на кампанию с рендером по `myRole` (субъекту —
 * «одногруппники и ментор», ментору — «отзыв о {Имя}»; имя — batch-UC),
 * кнопка кампании — мост в стори campaign (S03 `list:<campaignId>`).
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
      return this.#showHub(actor);
    }
    return this.unknownCommand(action, actor, session);
  }

  /** S02: список живых кампаний — тело с расшифровкой «о ком», кнопки-карточки. */
  async #showHub(actor: User): Promise<DialogResponse> {
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

    const lines = cards.map((card, i) =>
      card.myRole === 'mentor'
        ? md`${i + 1}\\. Поток «${titles.get(card.scopeId) ?? ''}» — ${reviewOf(names.get(card.subjectId))}\\. Осталось ${card.daysLeft} дн\\.`
        : md`${i + 1}\\. Поток «${titles.get(card.scopeId) ?? ''}» — одногруппники и ментор\\. Осталось ${card.daysLeft} дн\\.`,
    );
    const rows = cards.map((card) => [
      this.btn(
        card.myRole === 'mentor'
          ? `🏁 Поток «${titles.get(card.scopeId) ?? ''}» · ${reviewOf(names.get(card.subjectId))} · ${card.daysLeft} дн.`
          : `🏁 Поток «${titles.get(card.scopeId) ?? ''}» · ${card.progress.done}/${card.progress.total} · ${card.daysLeft} дн.`,
        this.cbFor('campaign', 'list', card.campaignId),
      ),
    ]);
    rows.push([buttons.mainMenu()]);

    const header: MdText = md`💬 *Мои отзывы* — о ком можно рассказать:`;
    return this.screen(mdJoin([header, md``, ...lines]), this.kb(rows));
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

/** Подпись «о ком» менторской карточки; имя не найдено — «о студенте». */
function reviewOf(name: string | undefined): string {
  return name ? `отзыв о ${name}` : 'отзыв о студенте';
}
