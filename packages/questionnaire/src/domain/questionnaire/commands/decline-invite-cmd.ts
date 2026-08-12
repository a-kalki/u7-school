import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import type {
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
  arMeta: QuestionnaireArMeta;
  input: DeclineInviteCmd;
  output: { cancelWarning?: string };
  errors: DeclineInviteCmdError;
  requiresAuth: false;
  type: 'command';
}

export type DeclineInviteCmdError =
  | BadRequestUcError
  | InternalUcError
  | QuestionnaireNotFoundUcError;
