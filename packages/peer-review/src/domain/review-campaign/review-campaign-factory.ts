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
 *
 * Объявляет все конструкторы кампаний (по образцу QuestionnaireFactory):
 * сейчас — createStreamCompleted («студент завершил поток»), в будущем —
 * create-методы по типам кампаний (course_completed, exit, сессии).
 * UC зовёт фабрику: агрегат не создаёт агрегат (ФР-3).
 */
export const ReviewCampaignFactory = {
  /**
   * Создать кампанию контекста stream_completed по завершению потока.
   *
   * `expiresAt` вычисляется из константы окна REVIEW_WINDOW_DAYS
   * и сохраняется в состоянии; дальше живость читает агрегат.
   * Время передаётся явно (решение 8): единый T на транзакцию UC.
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
    const expiresAt = new Date(now.getTime() + REVIEW_WINDOW_DAYS * DAY_MS);

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
   * `context` (для репозитория), по образцу QuestionnaireFactory.restore.
   *
   * Все контексты живут в одном классе агрегата (каркас + payload,
   * решение 1), поэтому ветка одна — она фиксирует точку расширения:
   * контексты с собственными классами получат свои ветки. Повреждённый
   * дискриминант отклоняется схемой варианта в конструкторе
   * (AR_INVARIANT_ERROR), а не молча.
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
