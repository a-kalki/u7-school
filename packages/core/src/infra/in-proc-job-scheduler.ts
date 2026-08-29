import type { Job } from '../api/job/job';
import type { JobExecutor } from '../api/job/job-executor';
import type { JobScheduler } from '../api/job/job-scheduler';
import type { Logger } from '../shared/logger';
import { InProcJobExecutor } from './in-proc-job-executor';
import { type JobRunRepo, MemoryJobRunRepo } from './job-run-repo';
import { JobSchedulePlanner } from './job-schedule-planner';
import { ScheduledJobRunner } from './scheduled-job-runner';

/** Зависимости планировщика */
export interface InProcJobSchedulerDeps {
  logger: Logger;
  /** Исполнитель прогонов (по умолчанию — InProcJobExecutor) */
  executor?: JobExecutor;
  /** Хранилище прогонов (по умолчанию — память, без переживания перезагрузки) */
  store?: JobRunRepo;
  /** Задержка первого прогона после старта, мс (по умолчанию 3 минуты) */
  startDelayMs?: number;
}

const SOURCE = 'job-scheduler';

/**
 * Планировщик заданий в текущем процессе: создаёт по раннеру на каждое
 * задание и делегирует ему запуск/остановку.
 *
 * Для переживания перезагрузки передайте JsonJobRunRepo (см. приложение).
 */
export class InProcJobScheduler implements JobScheduler {
  readonly #deps: InProcJobSchedulerDeps & {
    executor: JobExecutor;
    store: JobRunRepo;
  };
  #runners: ScheduledJobRunner[] = [];
  #started = false;

  constructor(deps: InProcJobSchedulerDeps) {
    this.#deps = {
      ...deps,
      executor: deps.executor ?? new InProcJobExecutor(),
      store: deps.store ?? new MemoryJobRunRepo(),
    };
  }

  start(jobs: readonly Job[]): void {
    if (this.#started) {
      throw new Error(
        'Планировщик уже запущен: вызовите stop() перед повторным start()',
      );
    }
    this.#started = true;

    const planner = new JobSchedulePlanner();

    for (const job of jobs) {
      this.#deps.logger.info(
        SOURCE,
        `Зарегистрирован job '${job.jobName}' (${describeSchedule(job)}): ${job.jobLabel}`,
      );

      const runner = new ScheduledJobRunner({
        job,
        planner,
        executor: this.#deps.executor,
        store: this.#deps.store,
        logger: this.#deps.logger,
        startDelayMs: this.#deps.startDelayMs,
      });
      runner.start();
      this.#runners.push(runner);
    }
  }

  stop(): void {
    for (const runner of this.#runners) {
      runner.stop();
    }
    this.#runners = [];
    this.#started = false;
  }
}

/** Человекочитаемое описание расписания для логов */
function describeSchedule(job: Job): string {
  const schedule = job.schedule;
  switch (schedule.kind) {
    case 'interval':
      return schedule.alignUtc
        ? `каждые ${schedule.intervalMs}мс по сетке UTC`
        : `интервал ${schedule.intervalMs}мс`;
    case 'dailyAt':
      return `ежедневно ${pad(schedule.hour)}:${pad(schedule.minute)} UTC`;
    case 'weeklyAt':
      return `еженедельно пн-вс[${schedule.weekday}] ${pad(schedule.hour)}:${pad(schedule.minute)} UTC`;
    case 'monthlyAt':
      return `ежемесячно ${schedule.day}-го ${pad(schedule.hour)}:${pad(schedule.minute)} UTC`;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
