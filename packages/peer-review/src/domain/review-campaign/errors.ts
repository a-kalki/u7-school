import type { ConflictError } from '@u7-scl/core/domain';

/** Окно кампании закрыто: писать и перезаписывать отзывы уже нельзя. */
export type ReviewWindowClosedUcError = ConflictError<
  'REVIEW_WINDOW_CLOSED',
  { campaignId: string; expiresAt: string }
>;
