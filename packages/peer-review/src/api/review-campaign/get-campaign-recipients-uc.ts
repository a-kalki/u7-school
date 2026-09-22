import { U7UseCase } from '@u7-scl/app/domain';
import { errNotFound } from '@u7-scl/core/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import { CampaignFactsDs } from '#domain/review-campaign/campaign-facts-ds';
import {
  CampaignRecipientsSchema,
  type GetCampaignRecipientsCmd,
  type GetCampaignRecipientsCmdMeta,
  GetCampaignRecipientsCmdSchema,
} from '#domain/review-campaign/commands/get-campaign-recipients-cmd';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';
import type { CampaignNotFoundUcError } from '../errors';

/**
 * Адресаты отзыва в кампании (ФР-7): роль и адресаты — AR/DS,
 * UC добывает кампанию и отзывы автора и собирает ответ.
 */
export class GetCampaignRecipientsUc extends U7UseCase<
  GetCampaignRecipientsCmdMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly ucName = 'get-campaign-recipients' as const;
  protected readonly ucLabel = 'Адресаты отзывов кампании' as const;
  protected readonly arMeta = {
    arName: 'ReviewCampaign' as const,
    arLabel: 'Кампания отзывов' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetCampaignRecipientsCmdSchema;
  protected readonly outputSchema = CampaignRecipientsSchema;

  async execute(
    command: GetCampaignRecipientsCmd,
  ): Promise<GetCampaignRecipientsCmdMeta['output']> {
    const state = await this.resolve.reviewCampaignRepo.findById(
      command.campaignId,
    );
    if (!state) {
      this.throwError(
        errNotFound<CampaignNotFoundUcError>(
          'PEER_REVIEW_CAMPAIGN_NOT_FOUND',
          'Кампания отзывов не найдена',
          { campaignId: command.campaignId },
        ) as GetCampaignRecipientsCmdMeta['errors'],
      );
    }
    const ar = ReviewCampaignFactory.restore(state);
    const myReviews = await this.resolve.reviewRepo.findByCampaignAndAuthor(
      command.campaignId,
      command.authorId,
    );
    const { myRole } = ar.reviewTargets(command.authorId);

    return {
      campaignId: command.campaignId,
      context: ar.context,
      myRole,
      mentorId: ar.mentorId,
      // Исход субъекта окна — тексты S03/S05 по парам «роль-судьба»
      subjectOutcome: ar.subjectOutcome,
      daysLeft: ar.daysLeft(new Date()),
      recipients: CampaignFactsDs.recipientsWithMyReview(
        ar,
        command.authorId,
        myReviews,
      ),
    };
  }
}
