import { describe, expect, mock, test } from 'bun:test';
import type { ApiModuleMeta, ModuleResolver } from '../../domain/types';
import { LogLevel } from '../../shared/logger';
import type { ErMeta, EventReaction } from '../er/event-reaction';
import { ApiModule } from '../module/api-module';
import { Job } from './job';

// ══ Тестовые типы ══

interface TestResolve extends ModuleResolver {
  value: string;
}

interface TestModuleMeta extends ApiModuleMeta {
  name: 'TestModule';
  url: '/test';
  ucMetas: {
    ucName: 'noop';
    arMeta: { name: 'TestAr'; label: 'Тестовый агрегат' };
    input: unknown;
    output: unknown;
    errors: never;
    requiresAuth: false;
    type: 'command';
  };
}

// ══ Тестовый Job ══

class TestJob extends Job<TestResolve> {
  readonly jobName = 'test-job';
  readonly jobLabel = 'Тестовая задача';
  readonly intervalMs = 60_000;

  executed = false;
  executedWithValue: string | undefined;

  async execute(): Promise<void> {
    this.executed = true;
    this.executedWithValue = this.resolve.value;
  }
}

// ══ Тестовый модуль ══

class TestModule extends ApiModule<TestModuleMeta, TestResolve> {
  readonly name = 'TestModule' as const;
  readonly useCases = [];
  readonly reactions: EventReaction<ErMeta>[] = [];
  override readonly jobs = [new TestJob()];
}

class TestModuleWithoutJobs extends ApiModule<TestModuleMeta, TestResolve> {
  readonly name = 'TestModule' as const;
  readonly useCases = [];
  readonly reactions: EventReaction<ErMeta>[] = [];
}

// ══ Помощник: создать тестовый резолвер ══

function makeResolve(value: string): TestResolve {
  const eb = {
    publish: mock(() => {}),
    subscribe: mock(() => () => {}),
  };
  return {
    value,
    eventBus: eb,
    appResolver: {
      eventBus: eb,
      logger: {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
        setLogLevel: mock(() => {}),
        getLogLevel: mock(() => LogLevel.DEBUG),
        setSourceLevel: mock(() => {}),
      },
      mode: 'test',
    },
  };
}

// ══ Тесты ══

describe('Job (контракт)', () => {
  test('предоставляет jobName, jobLabel и intervalMs', () => {
    const job = new TestJob();

    expect(job.jobName).toBe('test-job');
    expect(job.jobLabel).toBe('Тестовая задача');
    expect(job.intervalMs).toBe(60_000);
  });

  test('init() пробрасывает резолвер — execute() видит зависимости', async () => {
    const job = new TestJob();
    job.init(makeResolve('resolved-value'));

    await job.execute();

    expect(job.executed).toBe(true);
    expect(job.executedWithValue).toBe('resolved-value');
  });

  test('без init() resolve не определён', () => {
    const job = new TestJob();

    expect((job as unknown as { resolve: unknown }).resolve).toBeUndefined();
  });
});

describe('ApiModule.jobs (регистрация заданий)', () => {
  test('jobs по умолчанию — пустой массив', () => {
    const module = new TestModuleWithoutJobs(makeResolve('x'));

    expect(module.jobs).toEqual([]);
  });

  test('init() пробрасывает резолвер модуля в каждый job', async () => {
    const module = new TestModule(makeResolve('module-resolve'));
    const job = module.jobs[0] as TestJob;

    module.init();
    await job.execute();

    expect(job.executed).toBe(true);
    expect(job.executedWithValue).toBe('module-resolve');
  });

  test('повторный init() не ломает регистрацию', async () => {
    const module = new TestModule(makeResolve('first'));
    module.init();
    module.init();

    const job = module.jobs[0] as TestJob;
    await job.execute();

    expect(job.executedWithValue).toBe('first');
  });
});
