import type { Review } from './entity';

/**
 * Интерфейс репозитория отзывов.
 * Уникальность пары (campaignId, authorId, recipientId) — инвариант
 * реализации (json-репо, Фаза 5).
 */
export interface ReviewRepo {
  /** Сохранить отзыв. */
  save(review: Review): Promise<void>;
}
