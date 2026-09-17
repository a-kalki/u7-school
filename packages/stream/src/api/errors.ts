import type {
  AccessDeniedError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '@u7-scl/core/domain';

export type StreamNotFoundUcError = NotFoundError<
  'STREAM_NOT_FOUND',
  { uuid: string }
>;
export type StreamAccessDeniedUcError =
  AccessDeniedError<'STREAM_ACCESS_DENIED'>;
export type StreamConflictUcError = ConflictError<
  'STREAM_CONFLICT',
  {
    userId?: string;
    activeCount?: number;
    /** Список нетерминальных студентов, блокирующих завершение потока (ФР-2) */
    pending?: Array<{ userId: string; status: string }>;
  }
>;
export type StreamBadRequestUcError = BadRequestError<'GATE_NOT_PASSED'>;

export type StreamUcErrors =
  | StreamNotFoundUcError
  | StreamAccessDeniedUcError
  | StreamConflictUcError
  | StreamBadRequestUcError;
