import { Aggregate, errValidation, throwError } from '@u7-scl/core/domain';
import type { CampaignParticipant } from '../review-campaign/entity';
import type { ReviewArMeta } from './entity';
import {
  REVIEW_TEXT_MAX_LENGTH,
  REVIEW_TEXT_MIN_LENGTH,
  ReviewSchema,
} from './entity';
import type { ReviewTextInvalidUcError } from './errors';

/** Агрегат Review — текстовый отзыв одного участника кампании о другом. */
export class ReviewAr extends Aggregate<ReviewArMeta> {
  static readonly arName = 'Review';
  static readonly arLabel = 'Отзыв';

  constructor(state: ReviewArMeta['state']) {
    super(state, ReviewSchema);
  }

  /** Создать отзыв: снапшоты ролей/исхода автора — данные кампании. */
  static create(params: {
    campaignId: string;
    /** Автор — участник кампании (снапшот роли и исхода) */
    author: CampaignParticipant;
    recipient: { userId: string; role: 'student' | 'mentor' };
    text: string;
    now: Date;
  }): ReviewAr {
    const { author, recipient } = params;

    ReviewAr.#validateText(params.text);

    const state: ReviewArMeta['state'] = {
      uuid: crypto.randomUUID(),
      campaignId: params.campaignId,
      authorId: author.userId,
      authorRole: author.role,
      authorOutcome: author.outcome,
      recipientId: recipient.userId,
      recipientRole: recipient.role,
      text: params.text,
      createdAt: params.now.toISOString().slice(0, 16),
    };

    return new ReviewAr(state);
  }

  /** Перезаписать текст (окно гвардит UC через кампанию). */
  overwrite(text: string): void {
    ReviewAr.#validateText(text);
    this.safeUpdate({ text });
  }

  /** Валидация длины текста — REVIEW_TEXT_INVALID. */
  static #validateText(text: string): void {
    const length = text.length;
    if (length < REVIEW_TEXT_MIN_LENGTH || length > REVIEW_TEXT_MAX_LENGTH) {
      throwError(
        errValidation<ReviewTextInvalidUcError>(
          'REVIEW_TEXT_INVALID',
          `Текст отзыва должен быть от ${REVIEW_TEXT_MIN_LENGTH} до ${REVIEW_TEXT_MAX_LENGTH} символов`,
          { min: REVIEW_TEXT_MIN_LENGTH, max: REVIEW_TEXT_MAX_LENGTH, length },
        ),
      );
    }
  }
}
