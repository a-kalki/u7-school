import { U7UseCase } from '@u7-scl/app/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import {
  type ListScopeReviewsCmd,
  type ListScopeReviewsCmdMeta,
  ListScopeReviewsCmdSchema,
  ScopeReviewsSchema,
} from '#domain/review/commands/list-scope-reviews-cmd';
import type { ScopeReviewsProjection } from '#domain/review/scope-reviews-ds';
import { ScopeReviewsDs } from '#domain/review/scope-reviews-ds';

/**
 * Отзывы скоупа, сгруппированные по адресатам (ФР-7):
 * группировка — DS, UC добывает отзывы и добавляет scopeId.
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

  async execute(command: ListScopeReviewsCmd): Promise<ScopeReviewsProjection> {
    const reviews = await this.resolve.reviewRepo.findByScope(command.scopeId);
    return {
      scopeId: command.scopeId,
      recipients: ScopeReviewsDs.groupByRecipient(reviews),
    };
  }
}
