import type { Job } from '../api/job/job';
import type { JobExecutor } from '../api/job/job-executor';
import type { Logger } from '../shared/logger';
import type { JobRunStore } from './job-run-store';
import type { JobSchedulePlanner } from './job-schedule-planner';

/** Стартовая задержка по умолчанию: не конкурировать с кодом запуска приложения. */
export const DEFAULT_START_DELAY_MS = 3 * 60 * 1000;

/** Зависимости раннера */
export interface ScheduledJobRunnerDeps {
  /** Задание, которым владеет раннер */
  job: Job;
  /** Календарная математика расписаний */
  planner: JobSchedulePlanner;
  /** Исполнитель прогона (точка будущего воркера) */
  executor: JobExecutor;
  /** Хранилище моментов прогонов (переживание перезагрузки) */
  store: JobRunStore;
  logger: Logger;
  /** Задержка первого прогона после старта (мс), по умолчанию 3 минуты */
  startDelayMs?: number;
}

const SOURCE = 'job-runner';

/**
 * Владеет жизнью одного задания: рассчитывает следующий запуск,
 * выполняет прогоны через JobExecutor, применяет misfire-политику
 * и стартовую задержку, фиксирует lastRunAt.
 *
 * Правила:
 * - расписание считается от фактического конца предыдущего прогона
 *   (пересчёт после каждого прогона — устойчивость к дрейфу);
 * - упущенный (misfire) запуск выполняется один раз — через стартовую
 *   задержку, независимо от того, сколько запусков пропущено;
 * - параллельные прогоны одного задания не допускаются: тик во время
 *   прогона игнорируется, следующий запуск армится после завершения;
 * - ошибка прогона логируется, lastRunAt всё равно фиксируется
 *   (иначе рестарты зациклили бы догоняющие прогоны).
 */
export class ScheduledJobRunner {
  readonly #deps: ScheduledJobRunnerDeps;
  readonly #startDelayMs: number;

  #timer: ReturnType<typeof setTimeout> | undefined;
  #running = false;
  #started = false;

  constructor(deps: ScheduledJobRunnerDeps) {
    this.#deps = deps;
    this.#startDelayMs = deps.startDelayMs ?? DEFAULT_START_DELAY_MS;
  }

  /** Запускает задание по расписанию. Повторный вызов игнорируется. */
  start(): void {
    if (this.#started) return;
    this.#started = true;

    const lastRunIso = this.#deps.store.getLastRunAt(this.#deps.job.jobName);
    const lastRun = lastRunIso !== undefined ? new Date(lastRunIso) : undefined;
    const now = new Date();

    // runAtStart без истории: первый прогон через стартовую задержку
    if (lastRun === undefined && this.#isRunAtStart()) {
      this.#arm(this.#startDelayMs);
      return;
    }

    const next = this.#deps.planner.nextRunAfter(
      this.#deps.job.schedule,
      lastRun ?? now,
    );

    if (next.getTime() <= now.getTime()) {
      // Misfire: упущенный запуск — один догоняющий прогон
      this.#arm(this.#startDelayMs);
    } else {
      this.#arm(next.getTime() - now.getTime());
    }
  }

  /** Останавливает задание (снимает таймер). Идущий прогон не прерывается. */
  stop(): void {
    this.#started = false;
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  #isRunAtStart(): boolean {
    const schedule = this.#deps.job.schedule;
    return schedule.kind === 'interval' && schedule.runAtStart === true;
  }

  #arm(delayMs: number): void {
    this.#timer = setTimeout(() => {
      void this.#run();
    }, delayMs);
  }

  async #run(): Promise<void> {
    if (this.#running) return;
    this.#running = true;

    try {
      await this.#deps.executor.execute(this.#deps.job);
    } catch (err) {
      this.#deps.logger.warn(
        SOURCE,
        `Ошибка прогона job '${this.#deps.job.jobName}': ${String(err)}`,
      );
    } finally {
      this.#running = false;
      // lastRunAt фиксируем и при ошибке: рестарт не должен зацикливать догон
      this.#deps.store.setLastRunAt(
        this.#deps.job.jobName,
        new Date().toISOString(),
      );
      if (this.#started) {
        const next = this.#deps.planner.nextRunAfter(
          this.#deps.job.schedule,
          new Date(),
        );
        this.#arm(Math.max(0, next.getTime() - Date.now()));
      }
    }
  }
}
