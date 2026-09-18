import { U7UseCase } from '@u7-scl/app/domain';
import { errAccessDenied, errNotFound } from '@u7-scl/core/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import { ReviewPolicy } from '#domain/review/policy';
import {
  CampaignRecipientsSchema,
  type GetCampaignRecipientsCmd,
  type GetCampaignRecipientsCmdMeta,
  GetCampaignRecipientsCmdSchema,
} from '#domain/review-campaign/commands/get-campaign-recipients-cmd';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';
import type {
  CampaignNotFoundUcError,
  PeerReviewNotParticipantUcError,
} from '../errors';

/**
 * Адресаты отзыва в кампании: политика по роли/исходу автора (ФР-7).
 * Роль автора выводится из кампании; соученик пишет только в своём окне.
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
    const author = ar.findParticipant(command.authorId);
    if (
      !author ||
      (!ar.isSubject(command.authorId) && author.role !== 'mentor')
    ) {
      this.throwError(
        errAccessDenied<PeerReviewNotParticipantUcError>(
          'PEER_REVIEW_NOT_PARTICIPANT',
          'Автор не субъект окна и не ментор этой кампании',
          {},
        ) as GetCampaignRecipientsCmdMeta['errors'],
      );
    }

    const recipients = ReviewPolicy.recipientsOf(
      author,
      ar.participants,
      ar.subjectId,
    );
    const out = await Promise.all(
      recipients.map(async (r) => {
        const existing = await this.resolve.reviewRepo.findByPair(
          command.campaignId,
          command.authorId,
          r.userId,
        );
        return {
          userId: r.userId,
          role: r.role,
          ...(r.outcome ? { outcome: r.outcome } : {}),
          hasMyReview: existing !== undefined,
        };
      }),
    );

    return {
      campaignId: command.campaignId,
      myRole: ar.isSubject(command.authorId) ? 'subject' : 'mentor',
      daysLeft: ar.daysLeft(new Date()),
      recipients: out,
    };
  }
}
