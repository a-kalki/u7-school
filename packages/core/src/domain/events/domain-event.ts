/**
 * Доменное событие — неизменяемый факт, произошедший в системе.
 * Публикуется агрегатом при завершении значимого действия.
 */
export interface DomainEvent {
  /** Уникальный идентификатор события */
  eventId: string;
  /** Тип события в формате "aggregate.action" (например "questionnaire.completed") */
  eventType: string;
  /** Время возникновения в ISO-формате */
  occurredAt: string;
  /** Тип агрегата, породившего событие */
  aggregateType: string;
  /** ID агрегата, породившего событие */
  aggregateId: string;
  /** Произвольные данные события */
  payload: Record<string, unknown>;
}
