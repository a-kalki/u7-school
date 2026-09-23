import { JsonFileRepo } from '@u7-scl/core/infra';
import type { Review } from '#domain/review/entity';
import { ReviewSchema } from '#domain/review/entity';
import type { ReviewRepo } from '#domain/review/repo';

/**
 * Ошибка репозитория отзывов: попытка сохранить второй отзыв
 * с той же парой (campaignId, authorId, recipientId).
 */
export class ReviewJsonRepoError extends Error {
  constructor(message: string) {
    super(`[ReviewJsonRepo] ${message}`);
    this.name = 'ReviewJsonRepoError';
  }
}

/**
 * JSON-файловая реализация репозитория отзывов (ФР-9).
 * Уникальность пары (кампания, автор, адресат) гарантируется хранилищем:
 * перезапись отзыва — save с тем же uuid, дубль пары — ошибка.
 */
export class ReviewJsonRepo implements ReviewRepo {
  readonly #repo: JsonFileRepo<Review>;

  constructor(filePath: string) {
    this.#repo = new JsonFileRepo(ReviewSchema, filePath);
  }

  async save(review: Review): Promise<void> {
    const all = await this.#repo.readAll();
    const idx = all.findIndex((r) => r.uuid === review.uuid);

    if (idx !== -1) {
      // Перезапись существующего отзыва по uuid
      all[idx] = review;
    } else {
      // Новый отзыв: пара (кампания, автор, адресат) обязана быть свободна
      const duplicate = all.some(
        (r) =>
          r.campaignId === review.campaignId &&
          r.authorId === review.authorId &&
          r.recipientId === review.recipientId,
      );
      if (duplicate) {
        throw new ReviewJsonRepoError(
          `Отзыв пары (campaignId=${review.campaignId}, authorId=${review.authorId}, recipientId=${review.recipientId}) уже существует`,
        );
      }
      all.push(review);
    }

    await this.#repo.writeAll(all);
  }

  async findByPair(
    campaignId: string,
    authorId: string,
    recipientId: string,
  ): Promise<Review | undefined> {
    const all = await this.#repo.readAll();
    return all.find(
      (r) =>
        r.campaignId === campaignId &&
        r.authorId === authorId &&
        r.recipientId === recipientId,
    );
  }

  async findByCampaign(campaignId: string): Promise<Review[]> {
    const all = await this.#repo.readAll();
    return all.filter((r) => r.campaignId === campaignId);
  }

  async findByCampaignAndAuthor(
    campaignId: string,
    authorId: string,
  ): Promise<Review[]> {
    const all = await this.#repo.readAll();
    return all.filter(
      (r) => r.campaignId === campaignId && r.authorId === authorId,
    );
  }

  async findByScope(scopeId: string): Promise<Review[]> {
    const all = await this.#repo.readAll();
    return all.filter((r) => r.scopeId === scopeId);
  }

  async findByRecipient(recipientId: string): Promise<Review[]> {
    const all = await this.#repo.readAll();
    return all.filter((r) => r.recipientId === recipientId);
  }
}
