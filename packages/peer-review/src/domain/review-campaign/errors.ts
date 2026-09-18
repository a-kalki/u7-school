import type { AccessDeniedError, ConflictError } from '@u7-scl/core/domain';

/** Окно кампании закрыто: писать и перезаписывать отзывы уже нельзя. */
export type ReviewWindowClosedUcError = ConflictError<
  'REVIEW_WINDOW_CLOSED',
  { campaignId: string; expiresAt: string }
>;

/** Автор не субъект этого окна и не его ментор — писать здесь не может. */
export type PeerReviewNotParticipantUcError =
  AccessDeniedError<'PEER_REVIEW_NOT_PARTICIPANT'>;

/** Адресат вне списка допустимых политикой для роли автора. */
export type RecipientNotAllowedUcError = ConflictError<
  'PEER_REVIEW_RECIPIENT_NOT_ALLOWED',
  { campaignId: string; authorId: string; recipientId: string }
>;
