import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import type { ArMeta } from '#domain/ar/aggregate';
import { Aggregate } from '#domain/ar/aggregate';
import type { AccessDeniedError } from '#domain/errors/errors';
import { AppException } from '#domain/errors/errors';
import type { EventBus } from '#domain/events/event-bus';
import type { AppResolver, ModuleResolver } from '#domain/types';
import { UseCase } from './use-case';

// ══ Хелперы ══

const mockEventBus = {
  publish(_e: unknown): void {},
  subscribe(_n: string, _h: (e: unknown) => void): () => void {
    return () => {};
  },
} as unknown as EventBus;

const mockAppResolver = {
  logger: {},
  mode: 'test',
  eventBus: mockEventBus,
} as unknown as AppResolver;

// ══ Тестовый актор ══

interface TestActor {
  uuid: string;
  name: string;
}

const testActor: TestActor = { uuid: 'user-1', name: 'Иван' };

// ══ Тестовый агрегат ══

type AuthTestError = AccessDeniedError<'AuthTestError'>;

interface TestArMeta extends ArMeta {
  name: 'TestAr';
  label: 'Тестовый агрегат';
  state: { uuid: string; createdAt: string; updatedAt?: string } & Record<
    string,
    unknown
  >;
}

class TestAr extends Aggregate<TestArMeta> {
  static readonly arName = 'TestAr';
  static readonly arLabel = 'Тестовый агрегат';
}

/** Мета UC с параметризованной авторизацией */
interface AuthUcMeta<TAuth extends boolean = boolean> {
  ucName: 'test-auth';
  arMeta: TestArMeta;
  input: { data: string };
  output: { result: string };
  errors: AuthTestError;
  requiresAuth: TAuth;
  actor: TestActor;
  type: 'command' | 'query';
}

type AuthResolve = {
  prefix: string;
  eventBus: typeof mockEventBus;
  appResolver: typeof mockAppResolver;
} & ModuleResolver;

/** UseCase, требующий авторизацию */
class AuthRequiredUseCase extends UseCase<AuthUcMeta<true>, AuthResolve> {
  protected readonly ucName = 'test-auth' as const;
  protected readonly ucLabel = 'Тестовый UC с авторизацией';
  protected readonly arMeta = {
    arName: 'TestAr' as const,
    arLabel: 'Тестовый агрегат' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = v.object({ data: v.string() });
  protected readonly outputSchema = v.object({ result: v.string() });

  execute(command: { data: string }, actor: TestActor) {
    return { result: `${this.resolve.prefix}:${actor.uuid}:${command.data}` };
  }
}

/** UseCase без авторизации */
class AuthOptionalUseCase extends UseCase<AuthUcMeta<false>, AuthResolve> {
  protected readonly ucName = 'test-auth' as const;
  protected readonly ucLabel = 'Тестовый UC без авторизации';
  protected readonly arMeta = {
    arName: 'TestAr' as const,
    arLabel: 'Тестовый агрегат' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = v.object({ data: v.string() });
  protected readonly outputSchema = v.object({ result: v.string() });

  execute(command: { data: string }, actor?: TestActor) {
    return {
      result: `${this.resolve.prefix}:${actor?.uuid ?? 'anon'}:${command.data}`,
    };
  }
}

const authResolve: AuthResolve = {
  prefix: 'ok',
  eventBus: mockEventBus,
  appResolver: mockAppResolver,
};

describe('UseCase: авторизация', () => {
  test('requiresAuth=true требует actor, иначе выбрасывает ошибку', async () => {
    const uc = new AuthRequiredUseCase();
    uc.init(authResolve);

    let caught: unknown;
    try {
      await uc.handle({ data: 'test' }); // без actor
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.kind).toBe('unauthorized');
    expect(appEx.error.name).toBe('UNAUTHORIZED_ERROR');
  });

  test('requiresAuth=true с actor-объектом выполняется успешно', async () => {
    const uc = new AuthRequiredUseCase();
    uc.init(authResolve);

    const result = await uc.handle({ data: 'test' }, testActor);
    expect(result.result).toBe('ok:user-1:test');
  });

  test('requiresAuth=false работает без actor', async () => {
    const uc = new AuthOptionalUseCase();
    uc.init(authResolve);

    const result = await uc.handle({ data: 'test' });
    expect(result.result).toBe('ok:anon:test');
  });

  test('requiresAuth=false с actor-объектом передаёт его в execute', async () => {
    const uc = new AuthOptionalUseCase();
    uc.init(authResolve);

    const result = await uc.handle({ data: 'test' }, testActor);
    expect(result.result).toBe('ok:user-1:test');
  });
});

describe('UseCase: метаданные', () => {
  test('UseCase.getDocType() возвращает полные метаданные', () => {
    const uc = new AuthRequiredUseCase();
    const cmd = uc.getDocType();

    expect(cmd.ucName).toBe('test-auth');
    expect(cmd.ucLabel).toBe('Тестовый UC с авторизацией');
    expect(cmd.arName).toBe('TestAr');
    expect(cmd.arLabel).toBe('Тестовый агрегат');
    expect(cmd.type).toBe('command');
    expect(cmd.requiresAuth).toBe(true);
    expect(cmd.inputSchema).toBeDefined();
    expect(cmd.outputSchema).toBeDefined();
  });
});
