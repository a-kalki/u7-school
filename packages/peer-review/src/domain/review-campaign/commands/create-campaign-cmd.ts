import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { ReviewCampaign, ReviewCampaignArMeta } from '../entity';
import {
  CampaignContextSchema,
  StreamCompletedCampaignSchema,
} from '../entity';
import type { CreateCampaignCmdError } from './errors';

export const CreateCampaignCmdSchema = v.object({
  context: CampaignContextSchema,
  scopeId: StreamCompletedCampaignSchema.entries.scopeId,
});

export type CreateCampaignCmd = v.InferOutput<typeof CreateCampaignCmdSchema>;

export interface CreateCampaignCmdMeta extends UcMeta {
  ucName: 'create-campaign';
  arMeta: ReviewCampaignArMeta;
  input: CreateCampaignCmd;
  output: ReviewCampaign;
  errors: CreateCampaignCmdError;
  requiresAuth: false;
  type: 'command';
}
