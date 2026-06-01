import * as v from 'valibot';

/**
 * Статусы учебного потока.
 * - ENROLLMENT: открыта регистрация студентов
 * - ACTIVE: поток запущен, идёт процесс обучения
 * - COMPLETED: поток успешно завершён
 * - ARCHIVED: поток заархивирован
 */
export enum StreamStatus {
  ENROLLMENT = 'enrollment',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

/** Valibot-схема для валидации статуса потока */
export const StreamStatusSchema = v.picklist(
  [
    StreamStatus.ENROLLMENT,
    StreamStatus.ACTIVE,
    StreamStatus.COMPLETED,
    StreamStatus.ARCHIVED,
  ],
  `Недопустимый статус потока. Ожидается: ${Object.values(StreamStatus).join(', ')}`,
);
