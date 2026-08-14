import * as v from 'valibot';
import type { BaseQuestionnaireArMeta } from '../entity';
import { LikertQuestionPoolSchema } from '../likert/likert-question';
import type { BadRequestUcError, InternalUcError } from './errors';

export const SendLikertInviteCmdSchema = v.object({
  pool: LikertQuestionPoolSchema,
  ownerInfo: v.record(v.string(), v.unknown()),
});

export type SendLikertInviteCmd = v.InferOutput<
  typeof SendLikertInviteCmdSchema
>;

export interface SendLikertInviteCmdMeta {
  ucName: 'send-likert-invite';
  arMeta: BaseQuestionnaireArMeta;
  input: SendLikertInviteCmd;
  output: undefined;
  errors: SendLikertInviteCmdError;
  requiresAuth: true;
  type: 'command';
}

export type SendLikertInviteCmdError = BadRequestUcError | InternalUcError;
