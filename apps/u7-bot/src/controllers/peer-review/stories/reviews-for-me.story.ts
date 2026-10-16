import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';
import { renderReviewCard } from './review-render';

/**
 * US: «Отзывы мне» (S08) — все отзывы, адресованные пользователю.
 *
 * Вход: `view:<page>` — кнопка «📥 Отзывы мне» в хабе S02 (видна при
 * наличии хотя бы одного отзыва) и в его заглушке. Контент: UC
 * `list-my-reviews` — новые наверху (createdAt desc); имена авторов —
 * batch-UC `get-users-by-ids`, потоки — `get-stream` по scopeId.
 * Карточный просмотр: ровно один отзыв на экран с пагинацией ◀️ / ▶️.
 * Только чтение.
 */
export class ReviewsForMeStory extends U7BotUiStory {
  readonly name = 'reviews-for-me';

  /** Ключ кеша страниц (DialogCache — эпоха диалога). */
  #cacheKey = 'reviews-for-me:me';

  // ── Callback ──

  override async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, pageSeg] = action.split(':');
    if (cmd !== 'view') {
      return this.unknownCommand(action, actor, session);
    }
    const page = Number(pageSeg);
    return this.#showReviews(actor, session, Number.isNaN(page) ? 0 : page);
  }

  /** S08: карточный просмотр отзывов адресату (кеш страниц — диалог). */
  async #showReviews(
    actor: User,
    session: BotSession,
    pageIndex: number,
  ): Promise<DialogResponse> {
    return this.cardPagedScreen({
      build: () => this.#buildCards(actor),
      emptyScreen: () => this.#emptyScreen(),
      rows: () => this.#navRows(),
      cacheKey: this.#cacheKey,
      pageIndex,
      cbPage: (n) => this.cb('view', String(n)),
      session,
      tgId: actor.telegramId,
    });
  }

  /** Читает отзывы адресату, резолвит авторов и потоки, собирает карточки. */
  async #buildCards(
    actor: User,
  ): Promise<{ title: MdText; cards: MdText[]; payload: undefined }> {
    const { reviews } = await this.appApi.execute(
      'list-my-reviews',
      { userId: actor.uuid },
      actor,
    );

    const [names, titles] = await Promise.all([
      this.#namesOf([...new Set(reviews.map((r) => r.authorId))], actor),
      this.#titlesOf([...new Set(reviews.map((r) => r.scopeId))], actor),
    ]);

    const cards = reviews.map((review) =>
      renderReviewCard({
        authorName: names.get(review.authorId) ?? 'неизвестно',
        direction: review.direction,
        authorOutcome: review.authorOutcome,
        streamTitle: titles.get(review.scopeId) ?? 'неизвестно',
        createdAt: review.createdAt,
        text: review.text,
      }),
    );

    return {
      title: md`📥 *Отзывы мне*`,
      cards,
      payload: undefined,
    };
  }

  /** Экран-заглушка: отзывов нет (кнопка в хабе скрыта — сюда не попасть). */
  #emptyScreen(): DialogResponse {
    return this.screen(
      md`📭 Тебе пока не написали ни одного отзыва\\.`,
      this.kb([
        [this.btn('↩️ Мои отзывы', this.cbFor('my-reviews', 'hub'))],
        [buttons.mainMenu()],
      ]),
    );
  }

  /** Навигация под карточкой: назад в хаб S02, главное меню последним. */
  #navRows(): KbRows {
    return [
      [this.btn('↩️ Мои отзывы', this.cbFor('my-reviews', 'hub'))],
      [buttons.mainMenu()],
    ];
  }

  /** Названия потоков по scopeId карточек. */
  async #titlesOf(
    scopeIds: string[],
    actor: User,
  ): Promise<Map<string, string>> {
    const titles = new Map<string, string>();
    if (scopeIds.length === 0) return titles;
    await Promise.all(
      scopeIds.map(async (scopeId) => {
        try {
          const stream = await this.appApi.execute(
            'get-stream',
            { streamId: scopeId },
            actor,
          );
          titles.set(scopeId, stream.title);
        } catch {
          titles.set(scopeId, 'неизвестно');
        }
      }),
    );
    return titles;
  }

  /** Имена авторов — один batch-запрос. */
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

/** Псевдоним типа строк кнопок (rows клавиатуры). */
type KbRows = KbButton[][];
