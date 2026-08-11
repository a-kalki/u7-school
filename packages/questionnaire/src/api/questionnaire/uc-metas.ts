import type { UcMeta } from '@u7-scl/core/api';
import type {
  BadRequestUcError,
  InternalUcError,
  QuestionnaireActiveUcError,
  QuestionnaireNotFoundUcError,
} from '../../domain/questionnaire/errors';

// ── Start ──
export interface StartUcMeta extends UcMeta {
  ucName: 'start';
  input: { telegramId: number };
  output: unknown;
  errors: BadRequestUcError | InternalUcError | QuestionnaireActiveUcError;
}

// ── HandleAction ──
export interface HandleActionUcMeta extends UcMeta {
  ucName: 'handle-action';
  input: { telegramId: number; type: 'callback' | 'text'; value: string };
  output: unknown;
  errors: BadRequestUcError | InternalUcError | QuestionnaireNotFoundUcError;
}

// ── Abandon ──
export interface AbandonUcMeta extends UcMeta {
  ucName: 'abandon';
  input: { telegramId: number };
  output: void;
  errors: BadRequestUcError | InternalUcError | QuestionnaireNotFoundUcError;
}

// ── GetQuestionnaire ──
export interface GetQuestionnaireUcMeta extends UcMeta {
  ucName: 'get-questionnaire';
  input: { uuid: string };
  output: unknown;
  errors: InternalUcError | QuestionnaireNotFoundUcError;
}

// ── GetQuestionnairesByUser ──
export interface GetQuestionnairesByUserUcMeta extends UcMeta {
  ucName: 'get-questionnaires-by-user';
  input: { respondentId: number };
  output: unknown[];
  errors: InternalUcError;
}
