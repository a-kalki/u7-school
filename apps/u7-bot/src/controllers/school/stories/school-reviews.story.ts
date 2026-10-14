import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import type {
  RecipientReviewsGroup,
  ReviewSnapshotDto,
} from '@u7-scl/peer-review/domain';
import type { Stream } from '@u7-scl/stream/domain';
import { authorLabel, rolesOf } from '../../peer-review/stories/review-render';
import { buttons } from '../../shared/buttons';

/**
 * SH03 — Экран «Отзывы» (отзывы студентов о менторах школы).
 *
 * Вход: `school:reviews:list[:<page>]` — кнопка «💬 Отзывы» в хабе школы.
 * Логика:
 * 1. Получает все потоки школы (`list-streams({ schoolId })`).
 * 2. Собирает отзывы студентов о менторах (`list-scope-reviews({ scopeIds, direction: 'student_mentor' })`).
 * 3. Резолвит имена менторов и авторов через batch `get-users-by-ids`.
 * 4. Рендерит страницы через `pagedScreen` с кнопкой «⬅️ Назад в школу».
 */
export class SchoolReviewsStory extends U7BotUiStory {
  readonly name = 'reviews';

  override async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, pageSeg] = action.split(':');
    if (cmd !== 'list') {
      return this.unknownCommand(action, actor, session);
    }
    const page = Number(pageSeg);
    return this.#showReviews(actor, session, Number.isNaN(page) ? 0 : page);
  }

  async #showReviews(
    actor: User,
    session: BotSession,
    pageIndex: number,
  ): Promise<DialogResponse> {
    const schoolId = this.resolve.school.id;

    return this.pagedScreen({
      build: () => this.#buildBlocks(schoolId, actor),
      emptyScreen: () =>
        this.screen(
          md`💬 Пока нет отзывов о школе\\.`,
          this.kb([[buttons.backToSchool()]]),
        ),
      rows: () => [[buttons.backToSchool()]],
      cacheKey: `school-reviews:${schoolId}`,
      pageIndex,
      cbPage: (n) => this.cb('list', String(n)),
      session,
      tgId: actor.telegramId,
    });
  }

  async #buildBlocks(
    schoolId: string,
    actor: User,
  ): Promise<{ header: MdText; blocks: string[]; payload: undefined }> {
    const streams = (await this.appApi.execute(
      'list-streams',
      { schoolId },
      actor,
    )) as Stream[];

    const scopeIds = streams.map((s) => s.uuid);
    if (scopeIds.length === 0) {
      return {
        header: md`💬 *Отзывы о школе*`,
        blocks: [],
        payload: undefined,
      };
    }

    const projection = (await this.appApi.execute(
      'list-scope-reviews',
      { scopeIds, direction: 'student_mentor' },
      actor,
    )) as { recipients: RecipientReviewsGroup[] };

    const userIds = uniqueIds(projection.recipients);
    const names = await this.#namesOf(userIds, actor);

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
      header: md`💬 *Отзывы о школе*`,
      blocks,
      payload: undefined,
    };
  }

  async #namesOf(userIds: string[], actor: User): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    if (userIds.length === 0) return names;

    const users = (await this.appApi.execute(
      'get-users-by-ids',
      { userIds },
      actor,
    )) as Array<{ uuid: string; name: string }>;

    for (const user of users) {
      names.set(user.uuid, user.name);
    }
    return names;
  }
}

/** Рендер одного отзыва в блоке пагинации. */
function reviewBlock(args: {
  group: RecipientReviewsGroup;
  review: ReviewSnapshotDto;
  names: Map<string, string>;
}): string {
  const { group, review, names } = args;
  const roles = rolesOf(review.direction);
  const recipient = names.get(group.recipientId) ?? 'неизвестно';
  const author = names.get(review.authorId) ?? 'неизвестно';

  return md`👤 ${recipient} \\(${roles.recipient}\\):
«${review.text}» — ${author} \\(${authorLabel(review)}\\)`;
}

/** Извлечение уникальных ID адресатов и авторов из групп. */
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
