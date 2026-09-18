import { ReviewCampaignAr } from './a-root';
import { REVIEW_WINDOW_DAYS } from './constants';
import type { CampaignParticipant, ReviewCampaign } from './entity';

/** Миллисекунд в сутках. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Формат даты-времени агрегата — до минут (стандарт isoNow проекта). */
function isoMinute(date: Date): string {
  return date.toISOString().slice(0, 16);
}

/**
 * Единая фабрика агрегатов кампании отзывов.
 */
export const ReviewCampaignFactory = {
  /**
   * Создать кампанию контекста stream_completed по завершению потока.
   *
   * @param scopeId — uuid потока
   * @param participants — снапшот участников с исходами-проекциями
   * @param now — момент создания (берётся вызывающим, UC/ER)
   */
  createStreamCompleted(
    scopeId: string,
    participants: CampaignParticipant[],
    now: Date,
  ): ReviewCampaignAr {
    const expiresAt = new Date(
      now.getTime() + REVIEW_WINDOW_DAYS.streamCompleted * DAY_MS,
    );

    const state: ReviewCampaign = {
      uuid: crypto.randomUUID(),
      context: 'stream_completed',
      scopeId,
      createdAt: isoMinute(now),
      expiresAt: isoMinute(expiresAt),
      participants: structuredClone(participants),
      payload: {},
    };

    return new ReviewCampaignAr(state);
  },

  /**
   * Восстановить агрегат из сохранённого состояния по дискриминанту
   */
  restore(state: ReviewCampaign): ReviewCampaignAr {
    switch (state.context) {
      case 'stream_completed':
        return new ReviewCampaignAr(structuredClone(state));
      default:
        return new ReviewCampaignAr(structuredClone(state));
    }
  },
};
