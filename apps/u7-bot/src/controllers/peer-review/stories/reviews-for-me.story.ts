import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, KbButton } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';
import { authorLine } from './review-render';

/**
 * US: «Отзывы мне» (S08) — все отзывы, адресованные пользователю.
 *
 * Вход: `view:<page>` — кнопка «📥 Отзывы мне» в хабе S02 (видна при
 * наличии хотя бы одного отзыва) и в его заглушке. Контент: UC
 * `list-my-reviews` — новые наверху (createdAt desc); имена авторов —
 * batch-UC `get-users-by-ids` до нарезки страниц. Блок = отзыв: автор с
 * ролью, исходом (у автора-студента) и датой, ниже текст. Только чтение.
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

  /** S08: постраничный просмотр отзывов адресату (кеш страниц — диалог). */
  async #showReviews(
    actor: User,
    session: BotSession,
    pageIndex: number,
  ): Promise<DialogResponse> {
    return this.pagedScreen({
      build: () => this.#buildBlocks(actor),
      emptyScreen: () => this.#emptyScreen(),
      rows: () => this.#navRows(),
      cacheKey: this.#cacheKey,
      pageIndex,
      cbPage: (n) => this.cb('view', String(n)),
      session,
      tgId: actor.telegramId,
    });
  }

  /** Читает отзывы адресату, резолвит имена авторов и собирает блоки. */
  async #buildBlocks(
    actor: User,
  ): Promise<{ header: MdText; blocks: string[]; payload: undefined }> {
    const { reviews } = await this.appApi.execute(
      'list-my-reviews',
      { userId: actor.uuid },
      actor,
    );

    const names = await this.#namesOf(
      [...new Set(reviews.map((r) => r.authorId))],
      actor,
    );

    // Карточки-отзывы, разделённые линией (как в хабе S02): линия перед
    // всеми, кроме первой
    const blocks = reviews.map((review, i) => {
      const block = mdJoin([
        authorLine({
          name: names.get(review.authorId) ?? 'неизвестно',
          direction: review.direction,
          authorOutcome: review.authorOutcome,
          createdAt: review.createdAt,
        }),
        md`«${review.text}»`,
      ]);
      return i > 0 ? mdJoin([md`──────────────`, block]) : block;
    });

    return {
      header: this.#header(reviews.length),
      blocks,
      payload: undefined,
    };
  }

  /** Шапка: заголовок + интро «что это за место» + число отзывов. */
  #header(count: number): MdText {
    return mdJoin([
      md`📥 *Отзывы мне*`,
      md``,
      md`Все отзывы, которые оставили тебе\\. Новые — наверху\\.`,
      md``,
      md`${pluralReviews(count)} от участников твоих потоков и мероприятий\\.`,
    ]);
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

  /** Навигация под отзывами: назад в хаб S02, главное меню последним. */
  #navRows(): KbRows {
    return [
      [this.btn('↩️ Мои отзывы', this.cbFor('my-reviews', 'hub'))],
      [buttons.mainMenu()],
    ];
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

/** Русская плюрализация: 1 отзыв / 2 отзыва / 5 отзывов. */
function pluralReviews(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} отзыва`;
  }
  return `${n} отзывов`;
}
