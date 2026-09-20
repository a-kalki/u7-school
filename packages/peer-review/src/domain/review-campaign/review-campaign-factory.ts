import { ReviewCampaignAr } from './a-root';
import { REVIEW_WINDOW_DAYS } from './constants';
import type { ReviewCampaign, StudentOutcome } from './entity';

/** Миллисекунд в сутках. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Формат даты-времени агрегата — до минут (стандарт isoNow проекта). */
function isoMinute(date: Date): string {
  return date.toISOString().slice(0, 16);
}

/** Вход фабрики студенческой кампании — окно судьбы студента (ФР-3). */
export interface CreateStudentCampaignInput {
  /** uuid скоупа (для stream_fate — streamId). */
  scopeId: string;
  /** uuid студента, чьё событие открыло окно. */
  subjectId: string;
  /** uuid ментора скоупа — второй автор окна (payload). */
  mentorId: string;
  /** Исход судьбы субъекта — 4-значная проекция (payload). */
  subjectOutcome: StudentOutcome;
  /** id адресуемых соучеников — без субъекта и ментора (ФР-2/ФР-3). */
  participantIds: string[];
  /** Момент создания (берётся вызывающим, UC/ER). */
  now: Date;
}

/**
 * Единая фабрика агрегатов кампании отзывов.
 */
export const ReviewCampaignFactory = {
  /**
   * Создать студенческую кампанию контекста stream_fate (ФР-3):
   * окно 7 дней от now, инварианты адресации проверяет агрегат.
   */
  createStudentCampaign(input: CreateStudentCampaignInput): ReviewCampaignAr {
    const {
      scopeId,
      subjectId,
      mentorId,
      subjectOutcome,
      participantIds,
      now,
    } = input;
    const expiresAt = new Date(
      now.getTime() + REVIEW_WINDOW_DAYS.streamFate * DAY_MS,
    );

    const state: ReviewCampaign = {
      uuid: crypto.randomUUID(),
      context: 'stream_fate',
      scopeId,
      subjectId,
      createdAt: isoMinute(now),
      expiresAt: isoMinute(expiresAt),
      participants: [...participantIds],
      payload: { subjectOutcome, mentorId },
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
      case 'stream_fate':
        return new ReviewCampaignAr(structuredClone(state));
      default:
        return new ReviewCampaignAr(structuredClone(state));
    }
  },
};
