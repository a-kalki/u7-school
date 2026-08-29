import { afterAll, describe, expect, mock, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Job, JobSchedule } from '../api/job/job';
import { LogLevel } from '../shared/logger';
import { InProcJobExecutor } from './in-proc-job-executor';
import { InProcJobScheduler } from './in-proc-job-scheduler';
import { JobRunJsonRepo } from './job-run-json-repo';
import { MemoryJobRunRepo } from './job-run-repo';

// ══ Хелперы ══

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const info = mock(() => {});
  const warn = mock(() => {});
  return {
    logger: {
      debug: mock(() => {}),
      info,
      warn,
      error: mock(() => {}),
      setLogLevel: mock(() => {}),
      getLogLevel: mock(() => LogLevel.DEBUG),
      setSourceLevel: mock(() => {}),
    },
    info,
    warn,
  };
}

function makeJob(schedule: JobSchedule): Job & { runs: () => number } {
  let runs = 0;
  return {
    jobName: 'test-job',
    jobLabel: 'Тестовая задача',
    schedule,
    execute: async () => {
      runs++;
    },
    runs: () => runs,
  } as Job & { runs: () => number };
}

const activeSchedulers: InProcJobScheduler[] = [];

afterAll(() => {
  for (const scheduler of activeSchedulers.splice(0)) scheduler.stop();
});

// ══ Тесты ══

describe('InProcJobScheduler', () => {
  test('start запускает все задания; stop останавливает', async () => {
    const jobA = makeJob({ kind: 'interval', intervalMs: 20 });
    const jobB = makeJob({ kind: 'interval', intervalMs: 20 });
    const { logger, info } = makeLogger();
    const scheduler = new InProcJobScheduler({
      logger,
      store: new MemoryJobRunRepo(),
      startDelayMs: 5,
    });
    activeSchedulers.push(scheduler);

    scheduler.start([jobA, jobB]);
    await waitFor(() => jobA.runs() >= 1 && jobB.runs() >= 1);

    scheduler.stop();
    const aRuns = jobA.runs();
    const bRuns = jobB.runs();
    await sleep(60);
    expect(jobA.runs()).toBe(aRuns);
    expect(jobB.runs()).toBe(bRuns);

    // Регистрация залогирована
    expect(info).toHaveBeenCalledWith(
      'job-scheduler',
      expect.stringContaining('test-job'),
    );
  });

  test('повторный start без stop — ошибка', () => {
    const { logger } = makeLogger();
    const scheduler = new InProcJobScheduler({ logger });
    activeSchedulers.push(scheduler);

    scheduler.start([]);
    expect(() => scheduler.start([])).toThrow('уже запущен');
  });

  test('после stop можно запустить снова', async () => {
    const job = makeJob({ kind: 'interval', intervalMs: 20 });
    const { logger } = makeLogger();
    const scheduler = new InProcJobScheduler({
      logger,
      store: new MemoryJobRunRepo(),
      startDelayMs: 5,
    });

    scheduler.start([job]);
    scheduler.stop();
    expect(() => scheduler.start([job])).not.toThrow();
    activeSchedulers.push(scheduler);
  });
});

describe('InProcJobExecutor', () => {
  test('выполняет execute задания в текущем процессе', async () => {
    const job = makeJob({ kind: 'interval', intervalMs: 1000 });
    const executor = new InProcJobExecutor();

    await executor.execute(job);

    expect(job.runs()).toBe(1);
  });

  test('ошибка прогона пробрасывается вызывающему (планировщик логирует)', async () => {
    const job: Job = {
      jobName: 'failing',
      jobLabel: 'Падающая задача',
      schedule: { kind: 'interval', intervalMs: 1000 },
      execute: () => Promise.reject(new Error('boom')),
    } as unknown as Job;
    const executor = new InProcJobExecutor();

    await expect(executor.execute(job)).rejects.toThrow('boom');
  });
});

describe('JobRunJsonRepo', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'job-run-store-'));
  const filePath = join(tmpDir, 'sub', 'last-runs.json');

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('get без записи — undefined', () => {
    const store = new JobRunJsonRepo(filePath);
    expect(store.getLastRunAt('job-a')).toBeUndefined();
  });

  test('set → новый экземпляр читает записанное (переживание перезагрузки)', () => {
    const writer = new JobRunJsonRepo(filePath);
    writer.setLastRunAt('job-a', '2026-01-01T12:00:00.000Z');

    const reader = new JobRunJsonRepo(filePath);
    expect(reader.getLastRunAt('job-a')).toBe('2026-01-01T12:00:00.000Z');
  });

  test('повреждённый файл — история начинается заново, без падения', () => {
    writeFileSync(filePath, 'не-json{{{');

    const store = new JobRunJsonRepo(filePath);
    expect(store.getLastRunAt('job-a')).toBeUndefined();
    store.setLastRunAt('job-b', '2026-02-01T00:00:00.000Z');
    expect(new JobRunJsonRepo(filePath).getLastRunAt('job-b')).toBe(
      '2026-02-01T00:00:00.000Z',
    );
  });
});
