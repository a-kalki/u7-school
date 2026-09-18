import type { User } from '@u7-scl/app/domain';
import type { PeerReviewApiModule } from '#api/module';
import type { PeerReviewFacade } from '#domain/facade';
import type { ScopeFacts } from '#domain/review/commands/list-scope-facts-cmd';

/**
 * In-process реализация фасада peer-review.
 * Делегирует в query-UC API-модуля; своей логики не содержит (ФР-8).
 */
export class PeerReviewInProcFacade implements PeerReviewFacade {
  readonly #peerReviewApi: PeerReviewApiModule;

  constructor(peerReviewApi: PeerReviewApiModule) {
    this.#peerReviewApi = peerReviewApi;
  }

  async hasLiveCampaigns(userId: string, actor?: User): Promise<boolean> {
    const campaigns = await this.#peerReviewApi.execute(
      'get-my-campaigns',
      { userId, onlyLives: true },
      actor,
    );
    return campaigns.length > 0;
  }

  async hasReviews(scopeId: string, actor?: User): Promise<boolean> {
    const facts = await this.listScopeFacts(scopeId, actor);
    return facts.hasReviews;
  }

  async listScopeFacts(scopeId: string, actor?: User): Promise<ScopeFacts> {
    return await this.#peerReviewApi.execute(
      'list-scope-facts',
      { scopeId },
      actor,
    );
  }
}
