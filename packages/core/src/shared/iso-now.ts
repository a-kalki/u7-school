import { now } from './now';

/**
 * Возвращает текущую дату-время в формате, совместимом с v.isoDateTime valibot.
 * Формат: YYYY-MM-DDTHH:mm
 */
export function isoNow(): string {
  return now().toISOString().slice(0, 16);
}
