import { U7UseCase } from '@u7-scl/app/domain';
import * as v from 'valibot';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import { ReviewPolicy } from '#domain/review/policy';
import type { ReviewCampaignAr } from '#domain/review-campaign/a-root';
import {
  type GetMyCampaignsCmd,
  type GetMyCampaignsCmdMeta,
  GetMyCampaignsCmdSchema,
  MyCampaignSchema,
} from '#domain/review-campaign/commands/get-my-campaigns-cmd';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';

/**
 * Кампании, где пользователь субъект окна или ментор (ФР-7).
 * Роль автора выводится из кампании раздельными выборками репо.
 */
export class GetMyCampaignsUc extends U7UseCase<
  GetMyCampaignsCmdMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly ucName = 'get-my-campaigns' as const;
  protected readonly ucLabel = 'Мои кампании отзывов' as const;
  protected readonly arMeta = {
    arName: 'ReviewCampaign' as const,
    arLabel: 'Кампания отзывов' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetMyCampaignsCmdSchema;
  protected readonly outputSchema = v.array(MyCampaignSchema);

  async execute(
    command: GetMyCampaignsCmd,
  ): Promise<GetMyCampaignsCmdMeta['output']> {
    const now = new Date();

    const items: Array<{
      ar: ReviewCampaignAr;
      myRole: 'subject' | 'mentor';
    }> = [];
    for (const state of await this.resolve.reviewCampaignRepo.findActiveBySubject(
      command.userId,
    )) {
      items.push({
        ar: ReviewCampaignFactory.restore(state),
        myRole: 'subject',
      });
    }
    for (const state of await this.resolve.reviewCampaignRepo.findActiveByMentor(
      command.userId,
    )) {
      items.push({
        ar: ReviewCampaignFactory.restore(state),
        myRole: 'mentor',
      });
    }

    let filtered = items;
    if (command.onlyLives) {
      filtered = filtered.filter((i) => !i.ar.isExpired(now));
    }
    const context = command.filter?.context;
    if (context) {
      filtered = filtered.filter((i) => i.ar.context === context);
    }
    const scopeId = command.filter?.scopeId;
    if (scopeId) {
      filtered = filtered.filter((i) => i.ar.scopeId === scopeId);
    }

    const result: GetMyCampaignsCmdMeta['output'] = [];
    for (const { ar, myRole } of filtered) {
      const author = ar.findParticipant(command.userId);
      if (!author) continue;
      const recipients = ReviewPolicy.recipientsOf(
        author,
        ar.participants,
        ar.subjectId,
      );
      const reviews = await this.resolve.reviewRepo.findByCampaign(
        ar.state.uuid,
      );
      const done = reviews.filter((r) => r.authorId === command.userId).length;

      result.push({
        campaignId: ar.state.uuid,
        context: ar.context,
        scopeId: ar.scopeId,
        subjectId: ar.subjectId,
        myRole,
        expiresAt: ar.expiresAt,
        daysLeft: ar.daysLeft(now),
        progress: { done, total: recipients.length },
      });
    }
    return result;
  }
}
