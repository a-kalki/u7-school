import {
  afterEach,
  describe,
  expect,
  mock,
  setSystemTime,
  test,
} from 'bun:test';
import type { Job, JobSchedule } from '../api/job/job';
import { LogLevel } from '../shared/logger';
import { MemoryJobRunRepo } from './job-run-repo';
import { JobSchedulePlanner } from './job-schedule-planner';
import { ScheduledJobRunner } from './scheduled-job-runner';

// ══ Хелперы ══

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Ждёт выполнения предиката (поллинг с дедлайном). */
async function waitFor(
  predicate: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(5);
  }
}

function makeLogger() {
  const warn = mock(() => {});
  return {
    logger: {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn,
      error: mock(() => {}),
      setLogLevel: mock(() => {}),
      getLogLevel: mock(() => LogLevel.DEBUG),
      setSourceLevel: mock(() => {}),
    },
    warn,
  };
}

/** Мок job: считает старты прогонов, опционально падает/задерживается */
function makeJob(
  schedule: JobSchedule,
  overrides?: {
    fail?: boolean;
    durationMs?: number;
  },
): Job & { runs: () => number; starts: () => number } {
  let runs = 0;
  let starts = 0;
  return {
    jobName: 'test-job',
    jobLabel: 'Тестовая задача',
    schedule,
    execute: async () => {
      starts++;
      try {
        if (overrides?.durationMs) await sleep(overrides.durationMs);
        if (overrides?.fail) throw new Error('прогон упал');
        runs++;
      } finally {
        // runs считаем только успешные; starts — все попытки
      }
    },
    runs: () => runs,
    starts: () => starts,
  } as Job & { runs: () => number; starts: () => number };
}

const START_DELAY_MS = 10;

function makeRunner(job: Job, store: MemoryJobRunRepo) {
  const { logger, warn } = makeLogger();
  const executor = {
    execute: async (j: Job) => {
      await j.execute();
    },
  };
  const runner = new ScheduledJobRunner({
    job,
    planner: new JobSchedulePlanner(),
    executor,
    store,
    logger,
    startDelayMs: START_DELAY_MS,
  });
  return { runner, warn, store };
}

// Активные раннеры — гасим после каждого теста
const active: ScheduledJobRunner[] = [];

afterEach(() => {
  for (const runner of active.splice(0)) runner.stop();
  setSystemTime(undefined as unknown as Date); // вернуть реальные часы Bun не позволяет — но таймеры реальны
});

// ══ Тесты ══

describe('ScheduledJobRunner — interval', () => {
  test('первый прогон — после интервала от старта, затем по интервалу', async () => {
    const job = makeJob({ kind: 'interval', intervalMs: 30 });
    const { runner } = makeRunner(job, new MemoryJobRunRepo());
    active.push(runner);

    runner.start();

    await sleep(15);
    expect(job.starts()).toBe(0); // ещё рано

    await waitFor(() => job.starts() >= 1);
    await waitFor(() => job.starts() >= 2);
  });

  test('runAtStart без lastRunAt: первый прогон через стартовую задержку', async () => {
    const job = makeJob({
      kind: 'interval',
      intervalMs: 60_000,
      runAtStart: true,
    });
    const { runner } = makeRunner(job, new MemoryJobRunRepo());
    active.push(runner);

    runner.start();

    await waitFor(() => job.starts() >= 1, 500);
    expect(job.starts()).toBe(1);
  });

  test('runAtStart со свежим lastRunAt: быстрого прогона нет — ждём остаток интервала', async () => {
    const intervalMs = 60;
    const job = makeJob({ kind: 'interval', intervalMs, runAtStart: true });
    const store = new MemoryJobRunRepo();
    // последний прогон — половину интервала назад
    store.setLastRunAt(
      'test-job',
      new Date(Date.now() - intervalMs / 2).toISOString(),
    );
    const { runner } = makeRunner(job, store);
    active.push(runner);

    runner.start();

    // Стартовая задержка (10мс) прошла, но интервал с lastRun (ещё ~20мс) не истёк:
    // прогон должен ждать остаток интервала, а не стартовую задержку
    await sleep(START_DELAY_MS + 10);
    expect(job.starts()).toBe(0);

    await waitFor(() => job.starts() >= 1);
  });

  test('успешный прогон записывает lastRunAt в store', async () => {
    const job = makeJob({ kind: 'interval', intervalMs: 20 });
    const store = new MemoryJobRunRepo();
    const { runner } = makeRunner(job, store);
    active.push(runner);

    runner.start();
    await waitFor(() => job.starts() >= 1);

    expect(store.getLastRunAt('test-job')).toBeDefined();
  });

  test('stop(): прогоны прекращаются', async () => {
    const job = makeJob({ kind: 'interval', intervalMs: 20 });
    const { runner } = makeRunner(job, new MemoryJobRunRepo());

    runner.start();
    await waitFor(() => job.starts() >= 1);
    runner.stop();

    const runsAtStop = job.starts();
    await sleep(60);
    expect(job.starts()).toBe(runsAtStop);
  });

  test('ошибка прогона: лог warn, lastRunAt записан, следующий прогон происходит', async () => {
    const job = makeJob({ kind: 'interval', intervalMs: 20 }, { fail: true });
    const store = new MemoryJobRunRepo();
    const { runner, warn } = makeRunner(job, store);
    active.push(runner);

    runner.start();
    await waitFor(() => job.starts() >= 2);

    expect(warn).toHaveBeenCalled();
    expect(store.getLastRunAt('test-job')).toBeDefined();
  });

  test('долгий прогон: параллельный запуск не начинается', async () => {
    const job = makeJob(
      { kind: 'interval', intervalMs: 5 },
      { durationMs: 60 },
    );
    const { runner } = makeRunner(job, new MemoryJobRunRepo());
    active.push(runner);

    runner.start();
    await sleep(40); // несколько тиков интервала внутри одного прогона

    expect(job.starts()).toBe(1);
  });
});

describe('ScheduledJobRunner — календарные расписания', () => {
  test('misfire: упущенный ежедневный запуск выполняется после стартовой задержки', async () => {
    // Сейчас: 2026-01-10T13:00Z; расписание ежедневно 12:00;
    // lastRun — вчера 12:00 → сегодняшний 12:00 упущен → догоняющий прогон
    setSystemTime(new Date('2026-01-10T13:00:00.000Z'));
    const job = makeJob({ kind: 'dailyAt', hour: 12, minute: 0 });
    const store = new MemoryJobRunRepo();
    store.setLastRunAt('test-job', '2026-01-09T12:00:00.000Z');
    const { runner } = makeRunner(job, store);
    active.push(runner);

    runner.start();

    await waitFor(() => job.starts() >= 1, 500);
    expect(job.starts()).toBe(1);
  });

  test('misfire multi: упущено несколько суток — ровно один догоняющий прогон', async () => {
    setSystemTime(new Date('2026-01-10T13:00:00.000Z'));
    const job = makeJob({ kind: 'dailyAt', hour: 12, minute: 0 });
    const store = new MemoryJobRunRepo();
    store.setLastRunAt('test-job', '2026-01-05T12:00:00.000Z'); // 5 дней назад
    const { runner } = makeRunner(job, store);
    active.push(runner);

    runner.start();

    await waitFor(() => job.starts() >= 1, 500);
    await sleep(START_DELAY_MS * 4);
    expect(job.starts()).toBe(1); // не 5 — один догоняющий
  });

  test('без misfire: время впереди — прогона нет до расписания', async () => {
    setSystemTime(new Date('2026-01-10T10:00:00.000Z'));
    const job = makeJob({ kind: 'dailyAt', hour: 12, minute: 0 });
    const { runner } = makeRunner(job, new MemoryJobRunRepo());
    active.push(runner);

    runner.start();

    await sleep(START_DELAY_MS * 3);
    expect(job.starts()).toBe(0);
  });

  test('без lastRunAt и с прошедшим временем сегодня: это не misfire — ждём завтра', async () => {
    // lastRun нет → nextRunAfter(now) всегда в будущем → прогон только завтра
    setSystemTime(new Date('2026-01-10T13:00:00.000Z'));
    const job = makeJob({ kind: 'dailyAt', hour: 12, minute: 0 });
    const { runner } = makeRunner(job, new MemoryJobRunRepo());
    active.push(runner);

    runner.start();

    await sleep(START_DELAY_MS * 3);
    expect(job.starts()).toBe(0);
  });
});
