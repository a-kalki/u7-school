import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import type {
  RecipientReviewsGroup,
  ReviewDirection,
  StudentOutcome,
} from '@u7-scl/peer-review/domain';
import { Routes } from '../../shared/routes';

/**
 * US: Просмотр отзывов потока (S07) — только чтение.
 *
 * Вход: `view:<scopeId>[:<page>]` — кнопка «💬 Отзывы» в карточке потока
 * (streams S02, кросс-контроллерный мост Routes.peerReview.scopeReviews).
 * Контент: `list-scope-reviews` — группы по адресатам; блок пагинации —
 * один отзыв (строка адресата + текст + автор); имена — batch-UC
 * `get-users-by-ids` до нарезки страниц. Роли — из `direction`, лейбл
 * исхода — только у автора-студента (`authorOutcome`; автор-ментор без
 * лейбла). Кнопок перехода в живую кампанию нет (S07 — чтение).
 */
export class ScopeReviewsStory extends U7BotUiStory {
  readonly name = 'scope-reviews';

  override async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, scopeId, pageSeg] = action.split(':');
    if (cmd !== 'view' || !scopeId) {
      return this.unknownCommand(action, actor, session);
    }
    const page = Number(pageSeg);
    return this.#showReviews(
      scopeId,
      actor,
      session,
      Number.isNaN(page) ? 0 : page,
    );
  }

  /** S07: постраничный просмотр отзывов скоупа (кеш страниц — диалог). */
  async #showReviews(
    scopeId: string,
    actor: User,
    session: BotSession,
    pageIndex: number,
  ): Promise<DialogResponse> {
    // Блок = отзыв (строка адресата + «текст» — автор); страницы кешируются
    // в DialogCache — build (чтение домена) только при промахе кеша.
    return this.pagedScreen({
      build: () => this.#buildBlocks(scopeId, actor),
      emptyScreen: () =>
        this.screen(
          md`💬 Отзывов по потоку пока нет\\.`,
          this.kb([[this.#backToStream(scopeId)]]),
        ),
      rows: () => [[this.#backToStream(scopeId)]],
      cacheKey: `scope-reviews:${scopeId}`,
      pageIndex,
      cbPage: (n) => this.cb('view', scopeId, String(n)),
      session,
      tgId: actor.telegramId,
    });
  }

  /** Читает отзывы скоупа, резолвит имена и собирает блоки «адресат: отзыв». */
  async #buildBlocks(
    scopeId: string,
    actor: User,
  ): Promise<{ header: MdText; blocks: string[]; payload: undefined }> {
    const [projection, stream] = await Promise.all([
      this.appApi.execute('list-scope-reviews', { scopeId }, actor),
      this.appApi.execute('get-stream', { streamId: scopeId }, actor),
    ]);

    const names = await this.#namesOf(uniqueIds(projection.recipients), actor);

    const blocks = projection.recipients.flatMap((group) =>
      group.reviews.map((review) =>
        reviewBlock({
          group,
          review,
          names,
        }),
      ),
    );

    return {
      header: md`💬 *Отзывы* — поток «${stream.title}»`,
      blocks,
      payload: undefined,
    };
  }

  /** Все id скоупа (адресаты + авторы) одним batch-запросом. */
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

  /** Кнопка возврата в карточку потока (кросс-контроллерный мост). */
  #backToStream(scopeId: string) {
    return this.btn('⬅️ Назад к потоку', Routes.stream.view(scopeId));
  }
}

/** Уникальные id: адресаты групп + авторы отзывов (порядок сохраняем). */
function uniqueIds(groups: RecipientReviewsGroup[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const group of groups) {
    for (const id of [
      group.recipientId,
      ...group.reviews.map((r) => r.authorId),
    ]) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  return ids;
}

/** Снимок отзыва для рендера блока (контракт scope-reviews-ds). */
interface ReviewSnapshotLike {
  authorId: string;
  direction: ReviewDirection;
  authorOutcome?: StudentOutcome;
  text: string;
}

/**
 * Блок = отзыв: строка адресата с ролью, «текст» — автор с ролью и
 * (у автора-студента) лейблом исхода. Роли — из direction; имя не
 * найдено — «неизвестно».
 */
function reviewBlock(args: {
  group: RecipientReviewsGroup;
  review: ReviewSnapshotLike;
  names: Map<string, string>;
}): string {
  const { group, review, names } = args;
  const roles = rolesOf(review.direction);
  const recipient = names.get(group.recipientId) ?? 'неизвестно';
  const author = names.get(review.authorId) ?? 'неизвестно';
  const outcome =
    roles.author === 'студент' && review.authorOutcome
      ? ` · ${OUTCOME_LABELS[review.authorOutcome]}`
      : '';
  return md`👤 ${recipient} \\(${roles.recipient}\\):
«${review.text}» — ${author} \\(${roles.author}${outcome}\\)`;
}

/** Роли «кто о ком» из направления отзыва. */
function rolesOf(direction: ReviewDirection): {
  recipient: 'студент' | 'ментор';
  author: 'студент' | 'ментор';
} {
  switch (direction) {
    case 'student_mentor':
      return { recipient: 'ментор', author: 'студент' };
    case 'mentor_student':
      return { recipient: 'студент', author: 'ментор' };
    default:
      return { recipient: 'студент', author: 'студент' };
  }
}

/** Лейблы 4-значной проекции исходов (ui-spec S07). */
const OUTCOME_LABELS: Record<StudentOutcome, string> = {
  completed_passed: 'завершил и прошел',
  completed_not_passed: 'завершил и не прошел',
  dropped: 'забросил',
  never_started: 'не начал',
};
