import type { StudentOutcome } from '../review-campaign/entity';
import type { Review, ReviewDirection } from './entity';

/** Снимок отзыва для рендера: направление и снапшот исхода автора. */
export interface ReviewSnapshotDto {
  reviewId: string;
  authorId: string;
  direction: ReviewDirection;
  authorOutcome?: StudentOutcome;
  text: string;
  createdAt: string;
}

/** Группа отзывов об одном адресате. */
export interface RecipientReviewsGroup {
  recipientId: string;
  reviews: ReviewSnapshotDto[];
}

/** Проекция отзывов скоупа — тип данных для UI и внешних модулей. */
export interface ScopeReviewsProjection {
  scopeId: string;
  recipients: RecipientReviewsGroup[];
}

/**
 * DS: проекция отзывов скоупа (много агрегатов Review) для рендера.
 */
export const ScopeReviewsDs = {
  /**
   * Группировка отзывов по адресатам: группы в порядке первого
   * появления, внутри — по времени создания, затем по uuid.
   */
  groupByRecipient(reviews: readonly Review[]): RecipientReviewsGroup[] {
    const ordered = [...reviews].sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.uuid.localeCompare(b.uuid),
    );

    const groups = new Map<string, RecipientReviewsGroup>();
    for (const r of ordered) {
      let group = groups.get(r.recipientId);
      if (!group) {
        group = {
          recipientId: r.recipientId,
          reviews: [],
        };
        groups.set(r.recipientId, group);
      }
      group.reviews.push({
        reviewId: r.uuid,
        authorId: r.authorId,
        direction: r.direction,
        ...(r.authorOutcome ? { authorOutcome: r.authorOutcome } : {}),
        text: r.text,
        createdAt: r.createdAt,
      });
    }
    return [...groups.values()];
  },
};
