import type { ScopeFacts } from './review/commands/list-scope-facts-cmd';

/**
 * Фасад модуля peer-review для внешних модулей и UI-трека (ФР-8).
 * Только делегирование в query-UC; логики не содержит.
 */
export interface PeerReviewFacade {
  /** Есть ли у пользователя живые окна (субъект или ментор) — хаб S01/S02. */
  hasLiveCampaigns(userId: string): Promise<boolean>;

  /** Есть ли отзывы в скоупе. */
  hasReviews(scopeId: string): Promise<boolean>;

  /** Факты отзывов скоупа: наличие и количество. */
  listScopeFacts(scopeId: string): Promise<ScopeFacts>;
}
