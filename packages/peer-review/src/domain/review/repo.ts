import type { Review } from './entity';

/**
 * Интерфейс репозитория отзывов.
 * Уникальность пары (campaignId, authorId, recipientId) — инвариант
 * реализации (json-репо, Фаза 5).
 */
export interface ReviewRepo {
  /** Сохранить отзыв. */
  save(review: Review): Promise<void>;

  /** Отзыв парой (кампания, автор, адресат) — перезапись и ✅-признак. */
  findByPair(
    campaignId: string,
    authorId: string,
    recipientId: string,
  ): Promise<Review | undefined>;

  /** Все отзывы кампании — прогресс M/K. */
  findByCampaign(campaignId: string): Promise<Review[]>;

  /** Все отзывы скоупа — чтение и факты фасада (ФР-8). */
  findByScope(scopeId: string): Promise<Review[]>;
}
