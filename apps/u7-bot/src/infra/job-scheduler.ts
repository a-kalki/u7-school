import type { ApiModule } from '@u7-scl/core/api';
import type { ApiModuleMeta, ModuleResolver } from '@u7-scl/core/domain';
import type { Logger } from '@u7-scl/core/shared';

/** Функция остановки планировщика (снимает все зарегистрированные таймеры). */
export type StopJobScheduler = () => void;

/** Источник логов планировщика. */
const SOURCE = 'job-scheduler';

/**
 * Запускает планировщик периодических заданий (Job).
 *
 * Собирает jobs всех переданных модулей и запускает каждый по его
 * intervalMs через setInterval. Первый прогон — после истечения интервала.
 *
 * Ошибка одиночного прогона логируется (logger.warn) и не роняет процесс:
 * остальные задания продолжают выполняться по расписанию.
 *
 * @param modules — API-модули приложения (в т.ч. standalone, не входящие в ApiApp)
 * @param logger — логгер приложения
 * @returns функция остановки всех таймеров
 */
export function startJobScheduler(
  modules: readonly ApiModule<ApiModuleMeta, ModuleResolver>[],
  logger: Logger,
): StopJobScheduler {
  const timers: ReturnType<typeof setInterval>[] = [];

  for (const module of modules) {
    for (const job of module.jobs) {
      logger.info(
        SOURCE,
        `Зарегистрирован job '${job.jobName}' (интервал ${job.intervalMs}мс): ${job.jobLabel}`,
      );

      const timer = setInterval(() => {
        job.execute().catch((err: unknown) => {
          logger.warn(
            SOURCE,
            `Ошибка прогона job '${job.jobName}': ${String(err)}`,
          );
        });
      }, job.intervalMs);

      timers.push(timer);
    }
  }

  return () => {
    for (const timer of timers) {
      clearInterval(timer);
    }
    timers.length = 0;
  };
}
