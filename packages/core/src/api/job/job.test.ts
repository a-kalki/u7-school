import { describe, expect, mock, test } from 'bun:test';
import type { DomainEvent } from '../../domain/events/domain-event';
import type { ApiModuleMeta, ModuleResolver } from '../../domain/types';
import { LogLevel } from '../../shared/logger';
import type { ErMeta, EventReaction } from '../er/event-reaction';
import { ApiModule } from '../module/api-module';
import { Job, type JobMeta, type JobSchedule } from './job';

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

/** Мета job — типизирует jobName/jobLabel (аналог UcMeta для UC) */
interface TestJobMeta extends JobMeta {
  name: 'test-job';
  label: 'Тестовая задача';
}

// ══ Тестовый Job ══

class TestJob extends Job<TestJobMeta, TestResolve> {
  readonly jobName = 'test-job';
  readonly jobLabel = 'Тестовая задача';
  readonly schedule: JobSchedule = {
    kind: 'interval',
    intervalMs: 60_000,
  };

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
  readonly jobs = [new TestJob()];
}

class TestModuleWithoutJobs extends ApiModule<TestModuleMeta, TestResolve> {
  readonly name = 'TestModule' as const;
  readonly useCases = [];
  readonly reactions: EventReaction<ErMeta>[] = [];
  readonly jobs = [];
}

// ══ Помощники ══

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

/** Мок агрегата с накопленными событиями */
function makeAr(events: DomainEvent[]) {
  return {
    hasEvents: () => events.length > 0,
    flushEvents: () => events.splice(0),
  };
}

// ══ Тесты ══

describe('Job (контракт v2)', () => {
  test('предоставляет jobName, jobLabel и schedule', () => {
    const job = new TestJob();

    expect(job.jobName).toBe('test-job');
    expect(job.jobLabel).toBe('Тестовая задача');
    expect(job.schedule).toEqual({ kind: 'interval', intervalMs: 60_000 });
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

describe('Job.publishEvents (публикация событий агрегата)', () => {
  test('публикует все накопленные события агрегата в eventBus', () => {
    const resolve = makeResolve('x');
    const job = new TestJob();
    job.init(resolve);

    const eventA: DomainEvent = {
      eventId: 'a',
      eventName: 'test:a',
      occurredAt: '2026-01-01T00:00:00.000Z',
      aggregateName: 'TestAr',
      aggregateId: '1',
      payload: {},
    };
    const eventB: DomainEvent = {
      ...eventA,
      eventId: 'b',
      eventName: 'test:b',
    };

    (job as unknown as { publishEvents(ar: unknown): void }).publishEvents(
      makeAr([eventA, eventB]),
    );

    expect(resolve.eventBus.publish).toHaveBeenCalledTimes(2);
    expect(resolve.eventBus.publish).toHaveBeenNthCalledWith(1, eventA);
    expect(resolve.eventBus.publish).toHaveBeenNthCalledWith(2, eventB);
  });

  test('агрегат без событий — ничего не публикует', () => {
    const resolve = makeResolve('x');
    const job = new TestJob();
    job.init(resolve);

    (job as unknown as { publishEvents(ar: unknown): void }).publishEvents(
      makeAr([]),
    );

    expect(resolve.eventBus.publish).not.toHaveBeenCalled();
  });
});

describe('ApiModule.jobs (регистрация заданий)', () => {
  test('модуль явно без заданий: jobs — пустой массив', () => {
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

    const job = module.jobs[0] as TestJob;
    await job.execute();

    expect(job.executedWithValue).toBe('first');
  });
});
