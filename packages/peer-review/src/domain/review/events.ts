import type { DomainEvent } from '@u7-scl/core/domain';
import type { ReviewDirection } from './entity';

/**
 * Событие первой записи отзыва (перезапись текста событие не создаёт —
 * повторное уведомление адресата было бы спамом).
 * Подписчики: notify-review-recipient ER — уведомление адресату.
 */
export interface ReviewCreatedEvent extends DomainEvent {
  eventName: 'review.created';
  aggregateName: 'Review';
  payload: {
    reviewId: string;
    campaignId: string;
    /** Скоуп (поток) — денормализация для адресации UI-подписчиков. */
    scopeId: string;
    authorId: string;
    recipientId: string;
    direction: ReviewDirection;
  };
}
