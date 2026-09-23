import { U7UseCase } from '@u7-scl/app/domain';
import { errNotFound } from '@u7-scl/core/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import { ReviewAr } from '#domain/review/a-root';
import {
  type CreateReviewCmd,
  type CreateReviewCmdMeta,
  CreateReviewCmdSchema,
  ReviewSavedSchema,
} from '#domain/review/commands/create-review-cmd';
import type { Review } from '#domain/review/entity';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';
import type { CampaignNotFoundUcError } from '../errors';

/**
 * Создание/перезапись отзыва (ФР-7): окно и права гвардит домен
 * (ensureLive, assertCanWrite), UC добывает данные и сохраняет результат.
 */
export class CreateReviewUc extends U7UseCase<
  CreateReviewCmdMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly ucName = 'create-review' as const;
  protected readonly ucLabel = 'Написать отзыв' as const;
  protected readonly arMeta = {
    arName: 'Review' as const,
    arLabel: 'Отзыв' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateReviewCmdSchema;
  protected readonly outputSchema = ReviewSavedSchema;

  async execute(
    command: CreateReviewCmd,
  ): Promise<CreateReviewCmdMeta['output']> {
    const state = await this.resolve.reviewCampaignRepo.findById(
      command.campaignId,
    );
    if (!state) {
      this.throwError(
        errNotFound<CampaignNotFoundUcError>(
          'PEER_REVIEW_CAMPAIGN_NOT_FOUND',
          'Кампания отзывов не найдена',
          { campaignId: command.campaignId },
        ) as CreateReviewCmdMeta['errors'],
      );
    }
    const ar = ReviewCampaignFactory.restore(state);
    ar.ensureLive(new Date());
    const { direction, authorOutcome } = ar.assertCanWrite(
      command.authorId,
      command.recipientId,
    );

    const existing = await this.resolve.reviewRepo.findByPair(
      command.campaignId,
      command.authorId,
      command.recipientId,
    );
    const review = existing
      ? this.overwrite(existing, command.text)
      : ReviewAr.create({
          campaignId: command.campaignId,
          scopeId: ar.scopeId,
          authorId: command.authorId,
          direction,
          ...(authorOutcome !== undefined ? { authorOutcome } : {}),
          recipientId: command.recipientId,
          text: command.text,
          now: new Date(),
        });
    await this.resolve.reviewRepo.save(review.state);

    // Факт первой записи — в шину (подписчик: уведомление адресату);
    // перезапись событий не создаёт — publishEvents ничего не публикует.
    this.publishEvents(review);

    return {
      reviewId: review.state.uuid,
      campaignId: command.campaignId,
      recipientId: command.recipientId,
    };
  }

  /** Перезапись: uuid и createdAt пары сохраняются, меняется только текст. */
  private overwrite(existing: Review, text: string): ReviewAr {
    const ar = new ReviewAr(existing);
    ar.overwrite(text);
    return ar;
  }
}
