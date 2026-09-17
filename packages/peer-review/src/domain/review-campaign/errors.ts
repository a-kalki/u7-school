import type { ConflictError } from '@u7-scl/core/domain';

/**
 * Окно кампании закрыто: писать и перезаписывать отзывы уже нельзя.
 * Отличает «окно закрыто» от «кампания не найдена» (ФР-6).
 */
export type ReviewWindowClosedUcError = ConflictError<
  'REVIEW_WINDOW_CLOSED',
  { campaignId: string; expiresAt: string }
>;
