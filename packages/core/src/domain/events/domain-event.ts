/**
 * Доменное событие — неизменяемый факт, произошедший в системе.
 * Публикуется агрегатом при завершении значимого действия.
 */
export interface DomainEvent {
  /** Уникальный идентификатор события */
  eventId: string;
  /** Имя события (например "completed", "started") */
  eventName: string;
  /** Время возникновения в ISO-формате */
  occurredAt: string;
  /** Имя агрегата, породившего событие (например "Questionnaire") */
  aggregateName: string;
  /** ID агрегата, породившего событие */
  aggregateId: string;
  /** Произвольные данные события */
  payload: Record<string, unknown>;
}
