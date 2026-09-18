import { U7UseCase } from '@u7-scl/app/domain';
import * as v from 'valibot';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewCampaignAr } from '#domain/review-campaign/a-root';
import type { MyCampaignCard } from '#domain/review-campaign/campaign-facts-ds';
import { CampaignFactsDs } from '#domain/review-campaign/campaign-facts-ds';
import {
  type GetMyCampaignsCmd,
  type GetMyCampaignsCmdMeta,
  GetMyCampaignsCmdSchema,
  MyCampaignSchema,
} from '#domain/review-campaign/commands/get-my-campaigns-cmd';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';

/**
 * Список «моих кампаний» (ФР-7): репо добывает, домен считает
 * (роль — AR, прогресс M/K — DS), UC только фильтрует ввод и собирает.
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

  async execute(command: GetMyCampaignsCmd): Promise<MyCampaignCard[]> {
    const now = new Date();
    const repo = this.resolve.reviewCampaignRepo;

    const campaigns: ReviewCampaignAr[] = [];
    for (const state of await repo.findActiveBySubject(command.userId)) {
      campaigns.push(ReviewCampaignFactory.restore(state));
    }
    for (const state of await repo.findActiveByMentor(command.userId)) {
      campaigns.push(ReviewCampaignFactory.restore(state));
    }

    let selected = campaigns;
    if (command.onlyLives) {
      selected = selected.filter((ar) => !ar.isExpired(now));
    }
    const context = command.filter?.context;
    if (context) {
      selected = selected.filter((ar) => ar.context === context);
    }
    const scopeId = command.filter?.scopeId;
    if (scopeId) {
      selected = selected.filter((ar) => ar.scopeId === scopeId);
    }

    const result: MyCampaignCard[] = [];
    for (const ar of selected) {
      const myReviews = await this.resolve.reviewRepo.findByCampaignAndAuthor(
        ar.state.uuid,
        command.userId,
      );
      const facts = CampaignFactsDs.myCampaignFacts(
        ar,
        command.userId,
        myReviews,
        now,
      );
      result.push({
        campaignId: ar.state.uuid,
        context: ar.context,
        scopeId: ar.scopeId,
        subjectId: ar.subjectId,
        expiresAt: ar.expiresAt,
        ...facts,
      });
    }
    return result;
  }
}
