import type { UcMeta } from '@u7-scl/core/api';
import type { User } from '@u7-scl/user/domain';
import type {
  BadRequestUcError,
  InternalUcError,
  QuestionnaireNotFoundUcError,
} from '../../domain/questionnaire/errors';
import type { QuestionnairePool } from '../../domain/questionnaire/question';
import type { QuestionnaireActionResponse } from '../../domain/questionnaire/types';

// ── SendInvite (Путь A: фасад → UC → botFacade) ──
export interface SendInviteUcMeta extends UcMeta {
  ucName: 'send-invite';
  input: { user: User; pool: QuestionnairePool };
  output: undefined;
  errors: BadRequestUcError | InternalUcError;
}

// ── Start (Путь A: фасад → UC → botFacade) ──
export interface StartUcMeta extends UcMeta {
  ucName: 'start';
  input: { user: User; pool: QuestionnairePool };
  output: undefined;
  errors: BadRequestUcError | InternalUcError;
}

// ── StartByInvite (Путь B: контроллер → UC → return) ──
export interface StartByInviteUcMeta extends UcMeta {
  ucName: 'start-by-invite';
  input: { questionnaireId: string };
  output: QuestionnaireActionResponse;
  errors: BadRequestUcError | InternalUcError | QuestionnaireNotFoundUcError;
}

// ── DeclineInvite (Путь B) ──
export interface DeclineInviteUcMeta extends UcMeta {
  ucName: 'decline-invite';
  input: { questionnaireId: string };
  output: { cancelWarning?: string };
  errors: BadRequestUcError | InternalUcError | QuestionnaireNotFoundUcError;
}

// ── HandleAction (Путь B) ──
export interface HandleActionUcMeta extends UcMeta {
  ucName: 'handle-action';
  input: { questionnaireId: string; type: 'callback' | 'text'; value: string };
  output: QuestionnaireActionResponse;
  errors: BadRequestUcError | InternalUcError | QuestionnaireNotFoundUcError;
}

// ── Abandon (Путь B) ──
export interface AbandonUcMeta extends UcMeta {
  ucName: 'abandon';
  input: { questionnaireId: string };
  output: undefined;
  errors: BadRequestUcError | InternalUcError | QuestionnaireNotFoundUcError;
}

// ── GetCurrent ──
export interface GetCurrentUcMeta extends UcMeta {
  ucName: 'get-current';
  input: { questionnaireId: string };
  output: QuestionnaireActionResponse;
  errors: InternalUcError | QuestionnaireNotFoundUcError;
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
  input: { userId: number };
  output: unknown[];
  errors: InternalUcError;
}
