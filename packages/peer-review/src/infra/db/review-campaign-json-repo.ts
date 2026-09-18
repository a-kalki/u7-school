import { JsonFileRepo } from '@u7-scl/core/infra';
import type { ReviewCampaign } from '#domain/review-campaign/entity';
import { ReviewCampaignSchema } from '#domain/review-campaign/entity';
import type { ReviewCampaignRepo } from '#domain/review-campaign/repo';

/**
 * Ошибка репозитория кампаний: попытка сохранить вторую кампанию
 * с тем же ключом окна (scopeId, subjectId).
 */
export class ReviewCampaignJsonRepoError extends Error {
  constructor(message: string) {
    super(`[ReviewCampaignJsonRepo] ${message}`);
    this.name = 'ReviewCampaignJsonRepoError';
  }
}

/** Окно кампании истекло на момент now (граница включительно — как в AR). */
function isExpired(campaign: ReviewCampaign, now: Date): boolean {
  return now.getTime() >= new Date(campaign.expiresAt).getTime();
}

/**
 * JSON-файловая реализация репозитория кампаний отзывов (ФР-9).
 * Ключ кампании — пара (scopeId, subjectId): уникальность хранилище
 * гарантирует, идемпотентность ER опирается на findBySubject.
 */
export class ReviewCampaignJsonRepo implements ReviewCampaignRepo {
  readonly #repo: JsonFileRepo<ReviewCampaign>;

  constructor(filePath: string) {
    this.#repo = new JsonFileRepo(ReviewCampaignSchema, filePath);
  }

  async save(campaign: ReviewCampaign): Promise<void> {
    const all = await this.#repo.readAll();
    const idx = all.findIndex((c) => c.uuid === campaign.uuid);

    if (idx !== -1) {
      // Обновление существующей кампании по uuid
      all[idx] = campaign;
    } else {
      // Новая кампания: ключ окна (scopeId, subjectId) обязан быть свободен
      const duplicate = all.some(
        (c) =>
          c.scopeId === campaign.scopeId && c.subjectId === campaign.subjectId,
      );
      if (duplicate) {
        throw new ReviewCampaignJsonRepoError(
          `Кампания окна (scopeId=${campaign.scopeId}, subjectId=${campaign.subjectId}) уже существует`,
        );
      }
      all.push(campaign);
    }

    await this.#repo.writeAll(all);
  }

  async findBySubject(
    scopeId: string,
    subjectId: string,
  ): Promise<ReviewCampaign | undefined> {
    const all = await this.#repo.readAll();
    return all.find((c) => c.scopeId === scopeId && c.subjectId === subjectId);
  }

  async findActiveBySubject(userId: string): Promise<ReviewCampaign[]> {
    const now = new Date();
    const all = await this.#repo.readAll();
    return all.filter((c) => c.subjectId === userId && !isExpired(c, now));
  }

  async findActiveByMentor(userId: string): Promise<ReviewCampaign[]> {
    const now = new Date();
    const all = await this.#repo.readAll();
    return all.filter(
      (c) =>
        c.participants.some(
          (p) => p.userId === userId && p.role === 'mentor',
        ) && !isExpired(c, now),
    );
  }

  async findById(uuid: string): Promise<ReviewCampaign | undefined> {
    const all = await this.#repo.readAll();
    return all.find((c) => c.uuid === uuid);
  }
}
