import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { ApiModule, Job } from '@u7-scl/core/api';
import type { ApiModuleMeta, ModuleResolver } from '@u7-scl/core/domain';
import type { Logger } from '@u7-scl/core/shared';
import { startJobScheduler } from './job-scheduler';

// ══ Помощники ══

function makeLogger(): Logger {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    setLogLevel: mock(() => {}),
    getLogLevel: mock(() => 0),
    setSourceLevel: mock(() => {}),
  };
}

/** Создаёт мок-модуль с переданными jobs (планировщику нужно только .jobs). */
function makeModule(jobs: Job[]): ApiModule<ApiModuleMeta, ModuleResolver> {
  return { jobs } as unknown as ApiModule<ApiModuleMeta, ModuleResolver>;
}

function makeJob(overrides?: {
  intervalMs?: number;
  execute?: () => Promise<void>;
}): Job & { calls: () => number } {
  let calls = 0;
  const execute =
    overrides?.execute ??
    (async () => {
      calls++;
    });
  return {
    jobName: 'test-job',
    jobLabel: 'Тестовая задача',
    schedule: { kind: 'interval', intervalMs: overrides?.intervalMs ?? 5 },
    calls: () => calls,
    execute: async () => {
      await execute();
      calls++;
    },
  } as Job & { calls: () => number };
}

// Активные stop-функции — чтобы afterEach гасил таймеры даже при падении теста.
const activeStops: Array<() => void> = [];

afterEach(() => {
  for (const stop of activeStops.splice(0)) stop();
});

// ══ Тесты ══

describe('startJobScheduler', () => {
  test('собирает jobs всех модулей и запускает каждый по интервалу', async () => {
    const jobA = makeJob();
    const jobB = makeJob();
    const stop = startJobScheduler(
      [makeModule([jobA]), makeModule([]), makeModule([jobB])],
      makeLogger(),
    );
    activeStops.push(stop);

    await Bun.sleep(60);

    expect((jobA as { calls: () => number }).calls()).toBeGreaterThanOrEqual(1);
    expect((jobB as { calls: () => number }).calls()).toBeGreaterThanOrEqual(1);
  });

  test('ошибка прогона логируется и не останавливает планировщик', async () => {
    const logger = makeLogger();
    const failing = makeJob({
      execute: async () => {
        throw new Error('boom');
      },
    });
    const healthy = makeJob();
    const stop = startJobScheduler([makeModule([failing, healthy])], logger);
    activeStops.push(stop);

    await Bun.sleep(60);

    expect(logger.warn).toHaveBeenCalled();

    // Здоровый job продолжает выполняться после чужих ошибок
    const callsBefore = (healthy as { calls: () => number }).calls();
    expect(callsBefore).toBeGreaterThanOrEqual(1);
    await Bun.sleep(20);
    expect((healthy as { calls: () => number }).calls()).toBeGreaterThan(
      callsBefore,
    );
  });

  test('stop() останавливает все таймеры', async () => {
    const job = makeJob({ intervalMs: 5 });
    const stop = startJobScheduler([makeModule([job])], makeLogger());

    await Bun.sleep(30);
    const callsBefore = (job as { calls: () => number }).calls();
    expect(callsBefore).toBeGreaterThanOrEqual(1);

    stop();

    await Bun.sleep(40);
    expect((job as { calls: () => number }).calls()).toBe(callsBefore);
  });

  test('модули без jobs не создают таймеров', async () => {
    const logger = makeLogger();
    const stop = startJobScheduler([makeModule([])], logger);
    activeStops.push(stop);

    await Bun.sleep(20);

    expect(logger.info).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('Зарегистрирован job'),
    );
    expect(() => stop()).not.toThrow();
  });
});
