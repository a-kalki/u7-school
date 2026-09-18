import type { ReviewCampaign } from './entity';

/**
 * Интерфейс репозитория кампаний отзывов.
 * Ключ кампании — пара (scopeId, subjectId): окно судьбы студента (ФР-2).
 */
export interface ReviewCampaignRepo {
  /** Сохранить кампанию. Дубль (scopeId, subjectId) — ошибка репозитория. */
  save(campaign: ReviewCampaign): Promise<void>;

  /**
   * Кампания окна по ключу (scopeId, subjectId).
   * Основа идемпотентности ER: повтор события субъекта не создаёт дубль.
   */
  findBySubject(
    scopeId: string,
    subjectId: string,
  ): Promise<ReviewCampaign | undefined>;

  /** Активные (не истёкшие) кампании, где пользователь — субъект окна. */
  findActiveBySubject(userId: string): Promise<ReviewCampaign[]>;

  /** Активные (не истёкшие) кампании, где пользователь — ментор. */
  findActiveByMentor(userId: string): Promise<ReviewCampaign[]>;
}
