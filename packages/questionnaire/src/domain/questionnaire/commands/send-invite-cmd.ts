import * as v from 'valibot';
import type { BaseQuestionnaireArMeta } from '../entity';
import { QuestionnairePoolSchema } from '../question';
import type { BadRequestUcError, InternalUcError } from './errors';

export const SendInviteCmdSchema = v.object({
  pool: QuestionnairePoolSchema,
});

export type SendInviteCmd = v.InferOutput<typeof SendInviteCmdSchema>;

export interface SendInviteCmdMeta {
  ucName: 'send-invite';
  arMeta: BaseQuestionnaireArMeta;
  input: SendInviteCmd;
  output: undefined;
  errors: SendInviteCmdError;
  requiresAuth: true;
  type: 'command';
}

export type SendInviteCmdError = BadRequestUcError | InternalUcError;
