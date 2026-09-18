import type {
  AccessDeniedError,
  ConflictError,
  NotFoundError,
} from '@u7-scl/core/domain';
import type {
  ReviewDuplicateUcError,
  ReviewTextInvalidUcError,
} from '#domain/review/errors';
import type { ReviewWindowClosedUcError } from '#domain/review-campaign/errors';

/** Кампания отзывов не найдена. */
export type CampaignNotFoundUcError = NotFoundError<
  'PEER_REVIEW_CAMPAIGN_NOT_FOUND',
  { campaignId: string }
>;

/** Автор не участник кампании — писать отзывы в ней не может. */
export type PeerReviewNotParticipantUcError =
  AccessDeniedError<'PEER_REVIEW_NOT_PARTICIPANT'>;

/** Адресат вне списка допустимых политикой для роли автора. */
export type RecipientNotAllowedUcError = ConflictError<
  'PEER_REVIEW_RECIPIENT_NOT_ALLOWED',
  { campaignId: string; authorId: string; recipientId: string }
>;

export type PeerReviewUcErrors =
  | CampaignNotFoundUcError
  | PeerReviewNotParticipantUcError
  | RecipientNotAllowedUcError
  | ReviewWindowClosedUcError
  | ReviewDuplicateUcError
  | ReviewTextInvalidUcError;
