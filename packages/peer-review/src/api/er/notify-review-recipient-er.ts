import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewDirection } from '#domain/review/entity';
import type { ReviewCreatedEvent } from '#domain/review/events';

/**
 * Метаданные реакции уведомления адресата о новом отзыве
 */
export interface NotifyReviewRecipientErMeta
  extends ErMeta<ReviewCreatedEvent> {
  erName: 'notify-review-recipient';
}

/**
 * ER «уведомить адресата»: реакция на факт первой записи отзыва
 * (review.created; перезапись текста события не создаёт — см. ReviewCreatedEvent).
 *
 * Текст — упрощённый markdown без экранирования: диалект канала — забота
 * доставщика (NotifyStory). Доставка — через userFacade.notify (единый
 * механизм уведомлений). Автор/адресат не найдены или у адресата нет
 * telegramId — пропуск с лог-предупреждением; ошибки доставки изолирует шина.
 */
export class NotifyReviewRecipientEr extends EventReaction<
  NotifyReviewRecipientErMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly erName = 'notify-review-recipient' as const;
  protected readonly erLabel = 'Уведомить адресата о новом отзыве' as const;

  protected readonly eventNames = ['review.created'] as const;

  async handle(event: ReviewCreatedEvent): Promise<void> {
    const { reviewId, authorId, recipientId, direction } = event.payload;

    const [author, recipient] = await Promise.all([
      this.resolve.userFacade.getUserByUuid(authorId),
      this.resolve.userFacade.getUserByUuid(recipientId),
    ]);
    if (!author || !recipient?.telegramId) {
      this.resolve.appResolver.logger.warn(
        `peer-review:${this.erName}`,
        'Адресат недоступен — уведомление не отправлено',
        { reviewId, recipientId },
      );
      return;
    }

    await this.resolve.userFacade.notify(
      recipientId,
      this.#textOf(author.name, direction),
      'notify',
    );
  }

  /** Текст уведомления: роль автора — по направлению «кто о ком». */
  #textOf(authorName: string, direction: ReviewDirection): string {
    const role =
      direction === 'student_student'
        ? 'твой соученик'
        : direction === 'student_mentor'
          ? 'твой студент'
          : 'твой ментор';
    return `✍️ У тебя новый отзыв — автор ${authorName}, ${role}. Читать: «💬 Отзывы» в карточке потока.`;
  }
}
