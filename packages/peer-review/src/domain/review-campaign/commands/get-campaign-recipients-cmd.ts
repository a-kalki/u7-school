import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { PeerReviewUcErrors } from '../../../api/errors';
import { uuidField } from '../../shared/schema';
import { AuthorRoleSchema, type MyRecipientsView } from '../campaign-facts-ds';
import { StudentOutcomeSchema } from '../entity';

export const GetCampaignRecipientsCmdSchema = v.object({
  campaignId: uuidField('Некорректный формат UUID кампании'),
  authorId: uuidField('Некорректный формат UUID автора'),
});

export type GetCampaignRecipientsCmd = v.InferOutput<
  typeof GetCampaignRecipientsCmdSchema
>;

/** Адресат отзыва: id + ✅ «мой отзыв есть». */
export const RecipientSchema = v.object({
  userId: uuidField('Некорректный формат UUID адресата'),
  hasMyReview: v.boolean(),
});

export const CampaignRecipientsSchema = v.object({
  campaignId: uuidField('Некорректный формат UUID кампании'),
  myRole: AuthorRoleSchema,
  mentorId: uuidField('Некорректный формат UUID ментора'),
  /** Исход субъекта окна — выбор текстов S03/S05 (у автора-субъекта — его исход). */
  subjectOutcome: StudentOutcomeSchema,
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
