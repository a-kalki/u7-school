import type { NotFoundError, AccessDeniedError, ConflictError } from '@u7-scl/core/domain';

export type StreamNotFoundUcError = NotFoundError<
  'STREAM_NOT_FOUND',
  { uuid: string }
>;
export type StreamAccessDeniedUcError = AccessDeniedError<'STREAM_ACCESS_DENIED'>;
export type StreamConflictUcError = ConflictError<
  'STREAM_CONFLICT',
  { userId?: string }
>;

export type StreamUcErrors =
  | StreamNotFoundUcError
  | StreamAccessDeniedUcError
  | StreamConflictUcError;
