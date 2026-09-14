import type { DomainEvent } from '@u7-scl/core/domain';

/**
 * Событие «желающему открыто приглашение на поток» (wish.invited).
 *
 * Публикует ER invite-wishers при создании потока (открытии набора).
 * Адресация и цель желания — в payload; карточку с кнопкой отмены
 * рендерит UI-сторя wish-invite (контроллер courses) — канал invite.
 */
export interface WishInvitedEvent extends DomainEvent {
  eventName: 'wish.invited';
  aggregateName: 'Wish';
  payload: {
    /** uuid пользователя-желающего */
    userId: string;
    /** telegramId адресата (резолвит ER, без него приглашение не уходит) */
    telegramId: number;
    /** uuid потока с открытым набором */
    streamId: string;
    /** вид желания: приглашение на курс или на модуль */
    targetKind: 'course' | 'module';
    /** uuid курса (для course-желания) */
    courseId?: string;
    /** uuid модуля (для module-желания) */
    moduleId?: string;
  };
}

/**
 * Событие «желание подтверждено» (wish.confirmed).
 *
 * Публикует ER confirm-wish после перевода желания в confirmed
 * (анкетная ветка). Рассылку уведомлений менторам курса рендерит
 * UI-сторя wish-confirmed (контроллер courses) — канал notify;
 * тексты и адресацию менторов сторя решает сама.
 */
export interface WishConfirmedEvent extends DomainEvent {
  eventName: 'wish.confirmed';
  aggregateName: 'Wish';
  payload: {
    /** uuid пользователя, подтвердившего желание */
    userId: string;
    /** uuid курса, на который подтверждено желание */
    courseId: string;
  };
}
