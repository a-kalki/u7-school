import { U7UseCase } from '@u7-scl/app/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import {
  type ListMyReviewsCmd,
  type ListMyReviewsCmdMeta,
  ListMyReviewsCmdSchema,
  MyReviewsSchema,
} from '#domain/review/commands/list-my-reviews-cmd';
import type { Review } from '#domain/review/entity';

/**
 * «Отзывы мне» (S08): все отзывы, адресованные пользователю,
 * новые наверху — по createdAt (при равенстве — uuid) по убыванию.
 */
export class ListMyReviewsUc extends U7UseCase<
  ListMyReviewsCmdMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly ucName = 'list-my-reviews' as const;
  protected readonly ucLabel = 'Отзывы мне' as const;
  protected readonly arMeta = {
    arName: 'Review' as const,
    arLabel: 'Отзыв' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ListMyReviewsCmdSchema;
  protected readonly outputSchema = MyReviewsSchema;

  async execute(
    command: ListMyReviewsCmd,
  ): Promise<ListMyReviewsCmdMeta['output']> {
    const reviews = await this.resolve.reviewRepo.findByRecipient(
      command.userId,
    );
    return { reviews: this.#newestFirst(reviews).map(this.#toSnapshot) };
  }

  /** Сортировка «новые наверху»: createdAt desc, при равенстве — uuid desc. */
  #newestFirst(reviews: Review[]): Review[] {
    return [...reviews].sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.uuid.localeCompare(a.uuid),
    );
  }

  /** Снимок отзыва для UI (контракт scope-reviews-ds). */
  #toSnapshot(r: Review): ListMyReviewsCmdMeta['output']['reviews'][number] {
    return {
      reviewId: r.uuid,
      authorId: r.authorId,
      direction: r.direction,
      ...(r.authorOutcome ? { authorOutcome: r.authorOutcome } : {}),
      text: r.text,
      createdAt: r.createdAt,
    };
  }
}
