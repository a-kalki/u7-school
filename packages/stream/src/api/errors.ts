import type { AppError } from '@u7-scl/core/domain';

export type StreamNotFoundUcError = AppError<
  'STREAM_NOT_FOUND',
  'domain',
  'not_found'
>;
export type StreamAccessDeniedUcError = AppError<
  'STREAM_ACCESS_DENIED',
  'domain',
  'unauthorized'
>;

export type StreamUcErrors = StreamNotFoundUcError | StreamAccessDeniedUcError;
