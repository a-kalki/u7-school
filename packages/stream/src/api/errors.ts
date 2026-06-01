import type { NotFoundError, AccessDeniedError } from '@u7-scl/core/domain';

export type StreamNotFoundUcError = NotFoundError<
  'STREAM_NOT_FOUND',
  { uuid: string }
>;
export type StreamAccessDeniedUcError = AccessDeniedError<'STREAM_ACCESS_DENIED'>;

export type StreamUcErrors = StreamNotFoundUcError | StreamAccessDeniedUcError;
