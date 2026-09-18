import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { PeerReviewUcErrors } from '../../../api/errors';
import type { ParticipantOutcome } from '../entity';

export const GetCampaignRecipientsCmdSchema = v.object({
  campaignId: v.pipe(v.string(), v.uuid('Некорректный формат UUID кампании')),
  authorId: v.pipe(v.string(), v.uuid('Некорректный формат UUID автора')),
});

export type GetCampaignRecipientsCmd = v.InferOutput<
  typeof GetCampaignRecipientsCmdSchema
>;

/** Адресат отзыва: роль/исход из снапшота кампании и ✅ «мой отзыв есть». */
export const RecipientSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('Некорректный формат UUID адресата')),
  role: v.picklist(['student', 'mentor']),
  outcome: v.optional(
    v.picklist(['completed', 'dropped', 'in_progress', 'never_started']),
  ),
  hasMyReview: v.boolean(),
});

export const CampaignRecipientsSchema = v.object({
  campaignId: v.pipe(v.string(), v.uuid('Некорректный формат UUID кампании')),
  myRole: v.picklist(['subject', 'mentor']),
  daysLeft: v.pipe(v.number(), v.integer(), v.minValue(0)),
  recipients: v.array(RecipientSchema),
});

export type CampaignRecipients = v.InferOutput<typeof CampaignRecipientsSchema>;
export type Recipient = v.InferOutput<typeof RecipientSchema>;
export type RecipientOutcome = ParticipantOutcome;

export interface GetCampaignRecipientsCmdMeta extends UcMeta {
  ucName: 'get-campaign-recipients';
  input: GetCampaignRecipientsCmd;
  output: CampaignRecipients;
  errors: PeerReviewUcErrors;
  requiresAuth: true;
  type: 'query';
}
