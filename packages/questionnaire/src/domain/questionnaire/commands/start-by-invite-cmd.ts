import * as v from 'valibot';
import type { BaseQuestionnaireArMeta } from '../entity';
import type { QuestionnaireActionResponse } from '../types';
import type {
  AccessDeniedUcError,
  BadRequestUcError,
  InternalUcError,
  QuestionnaireNotFoundUcError,
} from './errors';

export const StartByInviteCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
});

export type StartByInviteCmd = v.InferOutput<typeof StartByInviteCmdSchema>;

export interface StartByInviteCmdMeta {
  ucName: 'start-by-invite';
  arMeta: BaseQuestionnaireArMeta;
  input: StartByInviteCmd;
  output: QuestionnaireActionResponse;
  errors: StartByInviteCmdError;
  requiresAuth: true;
  type: 'command';
}

export type StartByInviteCmdError =
  | BadRequestUcError
  | InternalUcError
  | QuestionnaireNotFoundUcError
  | AccessDeniedUcError;
