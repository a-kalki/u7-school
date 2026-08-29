import { describe, expect, mock, test } from 'bun:test';
import type { AppMeta } from '../../domain/types';
import type { Job } from '../job/job';
import type { JobScheduler } from '../job/job-scheduler';
import { ApiApp } from './api-app';
import { App } from './app';

// ══ Хелперы ══

function makeJob(name: string): Job {
  return {
    jobName: name,
    jobLabel: `Задача ${name}`,
    schedule: { kind: 'interval', intervalMs: 60_000 },
    execute: mock(async () => {}),
  } as unknown as Job;
}

/** Мок планировщика: фиксирует переданные задания */
function makeScheduler() {
  const started: string[][] = [];
  let stopCalls = 0;
  const scheduler: JobScheduler = {
    start: (jobs: readonly Job[]) => {
      started.push(jobs.map((job) => job.jobName));
    },
    stop: () => {
      stopCalls++;
    },
  };
  return { scheduler, started, stopCalls: () => stopCalls };
}

function makeAppWithMods(mods: { name: string; jobs: Job[] }[]): {
  app: ApiApp<AppMeta>;
  mods: unknown[];
} {
  const created = mods.map(({ name, jobs }) => ({
    name,
    useCases: [],
    reactions: [],
    jobs,
    init: mock(() => {}),
    hasCommand: () => false,
    execute: mock(async () => {}),
    getDocTypes: () => [],
  }));
  return { app: new ApiApp(created as never), mods: created };
}

// ══ Тесты ══

describe('ApiApp.init() — технические зависимости и каскадная инициализация', () => {
  test('init(scheduler) сохраняет планировщик и вызывает init() модулей', () => {
    const { scheduler } = makeScheduler();
    const { app, mods } = makeAppWithMods([{ name: 'a', jobs: [] }]);

    app.init(scheduler);

    expect(
      (mods[0] as { init: ReturnType<typeof mock> }).init,
    ).toHaveBeenCalled();
    app.stop(); // планировщик сохранён — stop() безопасен
    expect(app).toBeInstanceOf(ApiApp);
  });

  test('start() до init() — явная ошибка', () => {
    const { app } = makeAppWithMods([{ name: 'a', jobs: [] }]);

    expect(() => app.start()).toThrow('init');
  });
});

describe('ApiApp.start()/stop() — жизненный цикл заданий', () => {
  test('start() передаёт планировщику jobы всех своих модулей', () => {
    const { scheduler, started } = makeScheduler();
    const { app } = makeAppWithMods([
      { name: 'a', jobs: [makeJob('job-a1')] },
      { name: 'b', jobs: [makeJob('job-b1'), makeJob('job-b2')] },
    ]);

    app.init(scheduler);
    app.start();

    expect(started).toEqual([['job-a1', 'job-b1', 'job-b2']]);
  });

  test('start() без заданий: планировщику передаётся пустой список — no-op', () => {
    const { scheduler, started } = makeScheduler();
    const { app } = makeAppWithMods([{ name: 'a', jobs: [] }]);

    app.init(scheduler);
    app.start();

    expect(started).toEqual([[]]);
  });

  test('stop() останавливает планировщик', () => {
    const { scheduler, stopCalls } = makeScheduler();
    const { app } = makeAppWithMods([{ name: 'a', jobs: [] }]);

    app.init(scheduler);
    app.start();
    app.stop();

    expect(stopCalls()).toBe(1);
  });

  test('stop() без start() — безопасен', () => {
    const { scheduler } = makeScheduler();
    const { app } = makeAppWithMods([{ name: 'a', jobs: [] }]);

    app.init(scheduler);
    expect(() => app.stop()).not.toThrow();
  });
});

describe('ApiApp — наследование App', () => {
  test('остаётся App: модули доступны через getModules()', () => {
    const { scheduler } = makeScheduler();
    const { app } = makeAppWithMods([{ name: 'a', jobs: [] }]);

    app.init(scheduler);

    expect(app).toBeInstanceOf(App);
    expect(app.getModules().map((m) => m.name)).toEqual(['a']);
  });
});
