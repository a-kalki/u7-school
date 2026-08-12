import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import type { QuestionnaireActionResponse } from '../types';
import type {
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
  arMeta: QuestionnaireArMeta;
  input: StartByInviteCmd;
  output: QuestionnaireActionResponse;
  errors: StartByInviteCmdError;
  requiresAuth: false;
  type: 'command';
}

export type StartByInviteCmdError =
  | BadRequestUcError
  | InternalUcError
  | QuestionnaireNotFoundUcError;
