import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { PeerReviewUcErrors } from '../../../api/errors';
import { isoMinuteField, uuidField } from '../../shared/schema';
import { AuthorRoleSchema, type MyCampaignCard } from '../campaign-facts-ds';
import { CampaignContextSchema } from '../entity';

export const GetMyCampaignsCmdSchema = v.object({
  userId: uuidField('Некорректный формат UUID пользователя'),
  onlyLives: v.optional(v.boolean()),
  filter: v.optional(
    v.object({
      context: v.optional(CampaignContextSchema),
      scopeId: v.optional(uuidField('Некорректный формат UUID скоупа')),
    }),
  ),
});

export type GetMyCampaignsCmd = v.InferOutput<typeof GetMyCampaignsCmdSchema>;

/** Валидация карточки «моей кампании»; тип — из домена (campaign-facts-ds). */
export const MyCampaignSchema = v.object({
  campaignId: uuidField('Некорректный формат UUID кампании'),
  context: CampaignContextSchema,
  scopeId: uuidField('Некорректный формат UUID скоупа'),
  subjectId: uuidField('Некорректный формат UUID субъекта'),
  myRole: AuthorRoleSchema,
  expiresAt: isoMinuteField('Некорректный формат даты'),
  daysLeft: v.pipe(v.number(), v.integer(), v.minValue(0)),
  progress: v.object({
    done: v.pipe(v.number(), v.integer(), v.minValue(0)),
    total: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
});

export interface GetMyCampaignsCmdMeta extends UcMeta {
  ucName: 'get-my-campaigns';
  input: GetMyCampaignsCmd;
  output: MyCampaignCard[];
  errors: PeerReviewUcErrors;
  requiresAuth: true;
  type: 'query';
}
