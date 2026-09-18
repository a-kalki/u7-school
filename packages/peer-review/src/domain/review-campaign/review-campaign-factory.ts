import { ReviewCampaignAr } from './a-root';
import { REVIEW_WINDOW_DAYS } from './constants';
import type { CampaignParticipant, ReviewCampaign } from './entity';

/** Миллисекунд в сутках. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Формат даты-времени агрегата — до минут (стандарт isoNow проекта). */
function isoMinute(date: Date): string {
  return date.toISOString().slice(0, 16);
}

/** Вход фабрики студенческой кампании — окно судьбы студента (ФР-3). */
export interface CreateStudentCampaignInput {
  /** uuid скоупа (для stream_ended — streamId). */
  scopeId: string;
  /** uuid студента, чьё событие открыло окно. */
  subjectId: string;
  /** Снапшот окружения субъекта на момент события. */
  participants: CampaignParticipant[];
  /** Момент создания (берётся вызывающим, UC/ER). */
  now: Date;
}

/**
 * Единая фабрика агрегатов кампании отзывов.
 */
export const ReviewCampaignFactory = {
  /**
   * Создать студенческую кампанию контекста stream_ended (ФР-3):
   * окно 7 дней от now, инварианты субъекта проверяет агрегат.
   */
  createStudentCampaign(input: CreateStudentCampaignInput): ReviewCampaignAr {
    const { scopeId, subjectId, participants, now } = input;
    const expiresAt = new Date(
      now.getTime() + REVIEW_WINDOW_DAYS.streamEnded * DAY_MS,
    );

    const state: ReviewCampaign = {
      uuid: crypto.randomUUID(),
      context: 'stream_ended',
      scopeId,
      subjectId,
      createdAt: isoMinute(now),
      expiresAt: isoMinute(expiresAt),
      participants: structuredClone(participants),
      payload: {},
    };

    const ar = new ReviewCampaignAr(state);
    ar.announceCreated();
    return ar;
  },

  /**
   * Восстановить агрегат из сохранённого состояния по дискриминанту
   */
  restore(state: ReviewCampaign): ReviewCampaignAr {
    switch (state.context) {
      case 'stream_ended':
        return new ReviewCampaignAr(structuredClone(state));
      default:
        return new ReviewCampaignAr(structuredClone(state));
    }
  },
};
