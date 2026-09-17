import type { ConflictError, ValidationError } from '@u7-scl/core/domain';

/**
 * Отзыв парой (кампания, автор, адресат) уже написан.
 * Уникальность пары — инвариант репозитория (ФР-4); новая версия —
 * только перезаписью `overwrite(text)` в пределах окна.
 */
export type ReviewDuplicateUcError = ConflictError<
  'REVIEW_DUPLICATE',
  { campaignId: string; authorId: string; recipientId: string }
>;

/** Текст отзыва вне допустимой длины 10–3500 символов. */
export type ReviewTextInvalidUcError = ValidationError<
  'REVIEW_TEXT_INVALID',
  { min: number; max: number; length: number }
>;
