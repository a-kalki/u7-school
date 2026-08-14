import * as v from 'valibot';
import type { BaseQuestionnaireArMeta } from '../entity';
import { MetricQuestionPoolSchema } from '../metric/metric-question';
import { MetricAssessmentSchema } from '../metric/metric-questionnaire';
import type { BadRequestUcError, InternalUcError } from './errors';

export const SendMetricInviteCmdSchema = v.object({
  pool: MetricQuestionPoolSchema,
  assessment: MetricAssessmentSchema,
});

export type SendMetricInviteCmd = v.InferOutput<
  typeof SendMetricInviteCmdSchema
>;

export interface SendMetricInviteCmdMeta {
  ucName: 'send-metric-invite';
  arMeta: BaseQuestionnaireArMeta;
  input: SendMetricInviteCmd;
  output: undefined;
  errors: SendMetricInviteCmdError;
  requiresAuth: true;
  type: 'command';
}

export type SendMetricInviteCmdError = BadRequestUcError | InternalUcError;
