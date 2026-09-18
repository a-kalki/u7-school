import { U7UseCase } from '@u7-scl/app/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import {
  type ListScopeFactsCmd,
  type ListScopeFactsCmdMeta,
  ListScopeFactsCmdSchema,
  ScopeFactsSchema,
} from '#domain/review/commands/list-scope-facts-cmd';

/** Факты отзывов скоупа — под фасад hasReviews/listScopeFacts (ФР-8). */
export class ListScopeFactsUc extends U7UseCase<
  ListScopeFactsCmdMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly ucName = 'list-scope-facts' as const;
  protected readonly ucLabel = 'Факты отзывов скоупа' as const;
  protected readonly arMeta = {
    arName: 'Review' as const,
    arLabel: 'Отзыв' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ListScopeFactsCmdSchema;
  protected readonly outputSchema = ScopeFactsSchema;

  async execute(
    command: ListScopeFactsCmd,
  ): Promise<ListScopeFactsCmdMeta['output']> {
    const reviews = await this.resolve.reviewRepo.findByScope(command.scopeId);
    return {
      hasReviews: reviews.length > 0,
      reviewsCount: reviews.length,
    };
  }
}
