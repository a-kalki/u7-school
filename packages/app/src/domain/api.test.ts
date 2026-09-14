import { describe, expect, test } from 'bun:test';
import { AppException, type ModuleResolver } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { U7ApiModule, U7UseCase } from './api';
import { Role } from './user';

// ══ Хелперы ══

const eventBus = {
  publish(_e: unknown): void {},
  subscribe(_n: string, _h: (e: unknown) => void): () => void {
    return () => {};
  },
};

const resolve: ModuleResolver = {
  appResolver: { logger: console, mode: 'test', eventBus },
  eventBus,
} as unknown as ModuleResolver;

const validUser = {
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Иван',
  telegramId: 123,
  roles: [Role.STUDENT],
  createdAt: '2026-05-01T12:00',
};

// ══ Тестовые типы ══

interface TestCmdMeta {
  ucName: 'test-echo';
  arMeta: { name: 'TestAr'; label: 'Тестовый агрегат' };
  input: { x: string };
  output: { y: string };
  errors: never;
  requiresAuth: true;
  type: 'command';
}

interface TestModuleMeta {
  name: 'TestModule';
  url: '/test';
  ucMetas: TestCmdMeta;
}

class TestEchoUc extends U7UseCase<TestCmdMeta, ModuleResolver> {
  protected readonly ucName = 'test-echo' as const;
  protected readonly ucLabel = 'Эхо' as const;
  protected readonly arMeta = {
    arName: 'TestAr' as const,
    arLabel: 'Тестовый агрегат' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = v.object({ x: v.string() });
  protected readonly outputSchema = v.object({ y: v.string() });

  execute(command: { x: string }, actor: typeof validUser) {
    // actor — объект User с полями, а не строка actorId
    return { y: `${actor.uuid}:${actor.name}:${command.x}` };
  }
}

class TestModule extends U7ApiModule<TestModuleMeta, ModuleResolver> {
  readonly name = 'TestModule' as const;
  readonly useCases = [new TestEchoUc()];
  readonly reactions = [];
  readonly jobs = [];
}

describe('U7UseCase — закрытие дженерика актора на User', () => {
  test('execute получает actor-объект User', async () => {
    const uc = new TestEchoUc();
    uc.init(resolve);

    const result = await uc.handle({ x: 'go' }, validUser);
    expect(result.y).toBe(`${validUser.uuid}:Иван:go`);
  });

  test('без actor — UNAUTHORIZED (requiresAuth=true)', async () => {
    const uc = new TestEchoUc();
    uc.init(resolve);

    let caught: unknown;
    try {
      await uc.handle({ x: 'go' });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    expect((caught as AppException).error.kind).toBe('unauthorized');
  });
});

describe('U7ApiModule — execute с actor-объектом User', () => {
  test('прокидывает User-объект до use-case', async () => {
    const module = new TestModule(resolve);
    module.init();

    const result = await module.execute('test-echo', { x: 'hi' }, validUser);
    expect(result.y).toBe(`${validUser.uuid}:Иван:hi`);
  });
});
