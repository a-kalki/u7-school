import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { PeerReviewUcErrors } from '../../../api/errors';
import { uuidField } from '../../shared/schema';
import { AuthorRoleSchema, type MyRecipientsView } from '../campaign-facts-ds';
import { CampaignRoleSchema, ParticipantOutcomeSchema } from '../entity';

export const GetCampaignRecipientsCmdSchema = v.object({
  campaignId: uuidField('Некорректный формат UUID кампании'),
  authorId: uuidField('Некорректный формат UUID автора'),
});

export type GetCampaignRecipientsCmd = v.InferOutput<
  typeof GetCampaignRecipientsCmdSchema
>;

/** Адресат отзыва: участник кампании + ✅ «мой отзыв есть». */
export const RecipientSchema = v.object({
  userId: uuidField('Некорректный формат UUID адресата'),
  role: CampaignRoleSchema,
  outcome: v.optional(ParticipantOutcomeSchema),
  hasMyReview: v.boolean(),
});

export const CampaignRecipientsSchema = v.object({
  campaignId: uuidField('Некорректный формат UUID кампании'),
  myRole: AuthorRoleSchema,
  daysLeft: v.pipe(v.number(), v.integer(), v.minValue(0)),
  recipients: v.array(RecipientSchema),
});

export interface GetCampaignRecipientsCmdMeta extends UcMeta {
  ucName: 'get-campaign-recipients';
  input: GetCampaignRecipientsCmd;
  output: MyRecipientsView;
  errors: PeerReviewUcErrors;
  requiresAuth: true;
  type: 'query';
}
