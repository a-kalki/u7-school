import type { DomainEvent } from '@u7-scl/core/domain';

/**
 * Событие создания потока (открытия набора).
 *
 * Публикуется агрегатом Stream в фабричном методе create — поток создаётся
 * сразу в статусе ENROLLMENT, поэтому «создание» и «открытие набора» — один
 * факт. Потребители (ER invite-wishers) рассылают приглашения желающим.
 */
export interface StreamCreatedEvent extends DomainEvent {
  eventName: 'stream.created';
  aggregateName: 'Stream';
  payload: {
    /** uuid потока */
    streamId: string;
    /** uuid модуля потока (для резолва курса через фасад курсов) */
    moduleId: string;
  };
}

/**
 * Событие завершения потока.
 *
 * Кладётся агрегатом Stream в complete(). Потребители: уведомления
 * участников потока; peer-review кампании не ждёт этого события —
 * окна создаются из событий судьбы студента (student.completed /
 * student.abandoned) раньше закрытия потока.
 */
export interface StreamCompletedEvent extends DomainEvent {
  eventName: 'stream.completed';
  aggregateName: 'Stream';
  payload: {
    /** uuid потока */
    streamId: string;
  };
}
