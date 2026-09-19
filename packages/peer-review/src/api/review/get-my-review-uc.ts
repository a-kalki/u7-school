import { U7UseCase } from '@u7-scl/app/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import {
  type GetMyReviewCmd,
  type GetMyReviewCmdMeta,
  GetMyReviewCmdSchema,
  MyReviewSchema,
} from '#domain/review/commands/get-my-review-cmd';

/**
 * Мой отзыв на адресата (ФР-7, S04): текст для экрана перезаписи.
 * Отзыва нет — found: false (UI покажет обычный ввод S05).
 */
export class GetMyReviewUc extends U7UseCase<
  GetMyReviewCmdMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly ucName = 'get-my-review' as const;
  protected readonly ucLabel = 'Мой отзыв' as const;
  protected readonly arMeta = {
    arName: 'Review' as const,
    arLabel: 'Отзыв' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetMyReviewCmdSchema;
  protected readonly outputSchema = MyReviewSchema;

  async execute(
    command: GetMyReviewCmd,
  ): Promise<GetMyReviewCmdMeta['output']> {
    const review = await this.resolve.reviewRepo.findByPair(
      command.campaignId,
      command.authorId,
      command.recipientId,
    );
    if (!review) {
      return { found: false };
    }
    return { found: true, text: review.text };
  }
}
