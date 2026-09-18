import { U7UseCase } from '@u7-scl/app/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import {
  type ListScopeReviewsCmd,
  type ListScopeReviewsCmdMeta,
  ListScopeReviewsCmdSchema,
  ScopeReviewsSchema,
} from '#domain/review/commands/list-scope-reviews-cmd';

/**
 * Отзывы скоупа, сгруппированные по адресатам (ФР-7).
 * Снапшоты ролей/исходов берутся из самих отзывов — кампания не читается.
 */
export class ListScopeReviewsUc extends U7UseCase<
  ListScopeReviewsCmdMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly ucName = 'list-scope-reviews' as const;
  protected readonly ucLabel = 'Отзывы скоупа' as const;
  protected readonly arMeta = {
    arName: 'Review' as const,
    arLabel: 'Отзыв' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ListScopeReviewsCmdSchema;
  protected readonly outputSchema = ScopeReviewsSchema;

  async execute(
    command: ListScopeReviewsCmd,
  ): Promise<ListScopeReviewsCmdMeta['output']> {
    const reviews = await this.resolve.reviewRepo.findByScope(command.scopeId);
    const ordered = [...reviews].sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.uuid.localeCompare(b.uuid),
    );

    const groups = new Map<
      string,
      ListScopeReviewsCmdMeta['output']['recipients'][number]
    >();
    for (const r of ordered) {
      let group = groups.get(r.recipientId);
      if (!group) {
        group = {
          recipientId: r.recipientId,
          recipientRole: r.recipientRole,
          reviews: [],
        };
        groups.set(r.recipientId, group);
      }
      group.reviews.push({
        reviewId: r.uuid,
        authorId: r.authorId,
        authorRole: r.authorRole,
        ...(r.authorOutcome ? { authorOutcome: r.authorOutcome } : {}),
        text: r.text,
        createdAt: r.createdAt,
      });
    }

    return {
      scopeId: command.scopeId,
      recipients: [...groups.values()],
    };
  }
}
