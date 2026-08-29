import type { Job } from './job';

/**
 * Порт планировщика периодических заданий.
 *
 * ApiApp стартует job'ы всех своих модулей через реализацию порта
 * (по умолчанию — InProcJobScheduler из core/infra).
 */
export interface JobScheduler {
  /** Запускает задания по их расписанию. Повторный вызов — ошибка. */
  start(jobs: readonly Job[]): void;

  /** Останавливает все задания (снимает таймеры). */
  stop(): void;
}
