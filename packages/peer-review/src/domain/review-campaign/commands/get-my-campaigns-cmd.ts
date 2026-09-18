import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { PeerReviewUcErrors } from '../../../api/errors';

export const GetMyCampaignsCmdSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('Некорректный формат UUID пользователя')),
  onlyLives: v.optional(v.boolean()),
  filter: v.optional(
    v.object({
      context: v.optional(v.picklist(['stream_ended'])),
      scopeId: v.optional(
        v.pipe(v.string(), v.uuid('Некорректный формат UUID скоупа')),
      ),
    }),
  ),
});

export type GetMyCampaignsCmd = v.InferOutput<typeof GetMyCampaignsCmdSchema>;

/** Кампания в списке «мои»: роль автора и прогресс M/K (хаб S02). */
export const MyCampaignSchema = v.object({
  campaignId: v.pipe(v.string(), v.uuid('Некорректный формат UUID кампании')),
  context: v.picklist(['stream_ended']),
  scopeId: v.pipe(v.string(), v.uuid('Некорректный формат UUID скоупа')),
  subjectId: v.pipe(v.string(), v.uuid('Некорректный формат UUID субъекта')),
  myRole: v.picklist(['subject', 'mentor']),
  expiresAt: v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  daysLeft: v.pipe(v.number(), v.integer(), v.minValue(0)),
  progress: v.object({
    /** М — мои отзывы в кампании. */
    done: v.pipe(v.number(), v.integer(), v.minValue(0)),
    /** K — доступные адресаты по политике. */
    total: v.pipe(v.number(), v.integer(), v.minValue(0)),
  }),
});

export type MyCampaign = v.InferOutput<typeof MyCampaignSchema>;

export interface GetMyCampaignsCmdMeta extends UcMeta {
  ucName: 'get-my-campaigns';
  input: GetMyCampaignsCmd;
  output: MyCampaign[];
  errors: PeerReviewUcErrors;
  requiresAuth: true;
  type: 'query';
}
