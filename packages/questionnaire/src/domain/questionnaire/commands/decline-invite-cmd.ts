import * as v from 'valibot';
import type { BaseQuestionnaireArMeta } from '../entity';
import type {
  AccessDeniedUcError,
  BadRequestUcError,
  InternalUcError,
  QuestionnaireNotFoundUcError,
} from './errors';

export const DeclineInviteCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
});

export type DeclineInviteCmd = v.InferOutput<typeof DeclineInviteCmdSchema>;

export interface DeclineInviteCmdMeta {
  ucName: 'decline-invite';
  arMeta: BaseQuestionnaireArMeta;
  input: DeclineInviteCmd;
  output: undefined;
  errors: DeclineInviteCmdError;
  requiresAuth: true;
  type: 'command';
}

export type DeclineInviteCmdError =
  | BadRequestUcError
  | InternalUcError
  | QuestionnaireNotFoundUcError
  | AccessDeniedUcError;
