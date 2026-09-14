import type { DomainEvent, NotifyKind } from '@u7-scl/core/domain';

/**
 * Событие уведомления пользователя.
 *
 * Публикуется UC notify-user (модуль user) в ответ на команду notify-user.
 * Единственный подписчик — сторя notify контроллера user (bot-ui):
 * резолвит telegramId и доставляет текст через proactiveSender.notify.
 * Событие — не мутация агрегата: канал-агностичный факт «доставь текст
 * такого-то вида» (сегодня Telegram, завтра — web/mobile без изменения
 * отправителей).
 */
export interface UserNotifiedEvent extends DomainEvent {
  eventName: 'user.notified';
  aggregateName: 'User';
  payload: {
    /** uuid пользователя-адресата */
    userId: string;
    /** текст уведомления — упрощённый markdown; конвертация в диалект канала — в доставщике */
    text: string;
    /** вид уведомления (оформление реплики транспортом); по умолчанию — notify */
    kind?: NotifyKind;
  };
}
