/**
 * Хранилище моментов последних прогонов заданий.
 *
 * Даёт job'ам «переживание перезагрузки»: планировщик при старте
 * сравнивает lastRunAt с расписанием и выполняет упущенный запуск
 * (misfire), а интервальные — не раньше intervalMs от последнего прогона.
 *
 * Реализации: MemoryJobRunStore (тесты), JsonJobRunStore (файл).
 */
export interface JobRunStore {
  /** ISO-время последнего прогона задания или undefined, если не запускалось */
  getLastRunAt(jobName: string): string | undefined;

  /** Записать ISO-время последнего прогона задания */
  setLastRunAt(jobName: string, isoDateTime: string): void;
}

/** Хранилище прогонов в памяти (тесты, ephemeral-окружения). */
export class MemoryJobRunStore implements JobRunStore {
  #lastRuns = new Map<string, string>();

  getLastRunAt(jobName: string): string | undefined {
    return this.#lastRuns.get(jobName);
  }

  setLastRunAt(jobName: string, isoDateTime: string): void {
    this.#lastRuns.set(jobName, isoDateTime);
  }
}
