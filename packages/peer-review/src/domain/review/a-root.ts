import { Aggregate, errValidation, throwError } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { StudentOutcome } from '../review-campaign/entity';
import type { ReviewArMeta, ReviewDirection } from './entity';
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

  /** Создать отзыв: направление и снапшот исхода автора — данные кампании. */
  static create(params: {
    campaignId: string;
    /** Скоуп кампании — денормализация для выборок по скоупу (ФР-9). */
    scopeId: string;
    authorId: string;
    /** «Кто о ком» — вычислено кампанией (assertCanWrite). */
    direction: ReviewDirection;
    /** Снапшот исхода автора-студента; ментору исхода нет. */
    authorOutcome?: StudentOutcome;
    recipientId: string;
    text: string;
    now: Date;
  }): ReviewAr {
    ReviewAr.#validateText(params.text);

    const state: ReviewArMeta['state'] = {
      uuid: crypto.randomUUID(),
      scopeId: params.scopeId,
      campaignId: params.campaignId,
      authorId: params.authorId,
      direction: params.direction,
      ...(params.authorOutcome !== undefined
        ? { authorOutcome: params.authorOutcome }
        : {}),
      recipientId: params.recipientId,
      text: params.text,
      createdAt: params.now.toISOString().slice(0, 16),
    };

    const ar = new ReviewAr(state);
    ar.announceCreated();
    return ar;
  }

  /**
   * Зафиксировать факт первой записи отзыва (перезапись текста
   * событие не создаёт — см. ReviewCreatedEvent).
   * Вызывается фабричным create().
   */
  announceCreated(): void {
    this.addEvent({
      eventId: crypto.randomUUID(),
      eventName: 'review.created',
      occurredAt: isoNow(),
      aggregateName: 'Review',
      aggregateId: this._state.uuid,
      payload: {
        reviewId: this._state.uuid,
        campaignId: this._state.campaignId,
        scopeId: this._state.scopeId,
        authorId: this._state.authorId,
        recipientId: this._state.recipientId,
        direction: this._state.direction,
      },
    });
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
