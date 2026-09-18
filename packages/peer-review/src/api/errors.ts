import type { NotFoundError } from '@u7-scl/core/domain';
import type {
  ReviewDuplicateUcError,
  ReviewTextInvalidUcError,
} from '#domain/review/errors';
import type {
  PeerReviewNotParticipantUcError,
  RecipientNotAllowedUcError,
  ReviewWindowClosedUcError,
} from '#domain/review-campaign/errors';

/** Кампания отзывов не найдена. */
export type CampaignNotFoundUcError = NotFoundError<
  'PEER_REVIEW_CAMPAIGN_NOT_FOUND',
  { campaignId: string }
>;

export type PeerReviewUcErrors =
  | CampaignNotFoundUcError
  | PeerReviewNotParticipantUcError
  | RecipientNotAllowedUcError
  | ReviewWindowClosedUcError
  | ReviewDuplicateUcError
  | ReviewTextInvalidUcError;
