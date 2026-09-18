import type { ConflictError, NotFoundError } from '@u7-scl/core/domain';

/** Скоуп кампании (для stream_completed — поток) не найден. */
export type ScopeNotFoundUcError = NotFoundError<
  'REVIEW_SCOPE_NOT_FOUND',
  { scopeId: string }
>;

/**
 * В скоупе есть нетерминальные студенты — данные противоречат инварианту
 * завершения потока (ФР-2). Кампания не создаётся.
 */
export type ScopeNotTerminalUcError = ConflictError<
  'CAMPAIGN_SCOPE_NOT_TERMINAL',
  { scopeId: string; pending: string[] }
>;

/** Ошибки модуля peer-review (union). */
export type PeerReviewModuleError =
  | ScopeNotFoundUcError
  | ScopeNotTerminalUcError;

/** Ошибки команды create-campaign. */
export type CreateCampaignCmdError = PeerReviewModuleError;
