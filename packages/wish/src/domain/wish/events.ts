import type { DomainEvent } from '@u7-scl/core/domain';

/**
 * Событие приглашения желающего на открывшийся поток.
 *
 * Публикуется ER invite-wishers в ответ на stream.created (по одному
 * событию на каждое совпавшее активное желание). Потребители — подписки
 * UI-слоя бота: рендер приглашения с кнопками через ProactiveSender.
 */
export interface WishInviteEvent extends DomainEvent {
  eventName: 'wish:invite';
  aggregateName: 'Wish';
  payload: {
    /** uuid желания */
    wishId: string;
    /** uuid открывшегося потока */
    streamId: string;
    /** uuid пользователя */
    userId: string;
    /** telegramId пользователя (резолвится ER через фасад пользователей) */
    telegramId: number;
    /** вид желания — определяет адаптивный текст и cancel-маршрут */
    wishKind: 'course' | 'module';
    /** только course-желания: courseId из желания (для cancel-маршрута) */
    courseId?: string;
    /** только module-желания: moduleId из желания (для cancel-маршрута) */
    moduleId?: string;
  };
}
