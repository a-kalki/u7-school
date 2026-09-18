import type { CampaignContext, ReviewCampaign } from './entity';

/**
 * Интерфейс репозитория кампаний отзывов.
 */
export interface ReviewCampaignRepo {
  /** Сохранить кампанию. */
  save(campaign: ReviewCampaign): Promise<void>;

  /**
   * Кампания контекста по скоупу (для stream_completed — streamId).
   * Основа идемпотентности ER: повторное событие завершения потока
   * не создаёт дубль кампании.
   */
  findByScope(
    context: CampaignContext,
    scopeId: string,
  ): Promise<ReviewCampaign | undefined>;
}
