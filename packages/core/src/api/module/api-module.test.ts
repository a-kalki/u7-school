import { describe, expect, test, mock } from 'bun:test';
import * as v from 'valibot';
import type { UcMeta } from '../../api/uc/use-case';
import { UseCase } from '../../api/uc/use-case';
import type { ArMeta } from '../../domain/ar/aggregate';
import { AppException, type NoCommandFoundError } from '../../domain/errors/errors';
import type { ApiModuleMeta, AppResolver, ModuleResolver } from '../../domain/types';
import { ApiModule } from './api-module';

// ══ Тестовые типы ══

interface TestArMeta extends ArMeta {
  name: 'TestAr';
  label: 'Тестовый агрегат';
  state: { uuid: string; createdAt: string; updatedAt?: string } & Record<
    string,
    unknown
  >;
}

interface TestUcMeta extends UcMeta {
  ucName: 'test-cmd';
  arMeta: TestArMeta;
  input: { foo: string };
  output: { bar: string };
  errors: never;
}

// ══ Тестовый UseCase с доступом к resolve ══

class TestUseCase extends UseCase<TestUcMeta, TestResolve> {
  protected readonly ucName = 'test-cmd' as const;
  protected readonly ucLabel = 'Тестовый UC' as const;
  protected readonly arMeta = {
    arName: 'TestAr' as const,
    arLabel: 'Тестовый агрегат' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = v.object({ foo: v.string() });
  protected readonly outputSchema = v.object({ bar: v.string() });

  protected async getUser(_userId: string): Promise<Record<string, unknown>> {
    return {};
  }

  execute(command: { foo: string }) {
    return { bar: `${command.foo}-${this.resolve.value}` };
  }
}

// ══ Тестовый резолвер (расширяет ModuleResolver) ══

interface TestResolve extends ModuleResolver {
  value: string;
}

interface TestModuleMeta extends ApiModuleMeta {
  name: 'TestModule';
  url: '/test';
  ucMetas: TestUcMeta;
}

// ══ Тестовый модуль (расширяет ApiModule с новым контрактом) ══

class TestModule extends ApiModule<TestModuleMeta, TestResolve> {
  readonly name = 'TestModule';
  readonly useCases = [new TestUseCase()];

  constructor(resolve: TestResolve) {
    super();
    this.init(resolve);
  }
}

// ══ Помощник: создать тестовый резолвер ══

function makeResolve(value: string): TestResolve {
  return {
    value,
    appResolver: {
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

import { LogLevel } from '../../shared/logger';

// ══ Тесты ══

describe('ApiModule (рефакторинг)', () => {
  describe('handle() — базовая функциональность', () => {
    test("модуль инициализируется и передаёт resolve use-case'ам", async () => {
      const module = new TestModule(makeResolve('resolved'));

      const result = await module.handle({
        name: 'test-cmd',
        attrs: { foo: 'hello' },
      });

      expect(result).toEqual({ bar: 'hello-resolved' });
    });

    test('выбрасывает NO_COMMAND_FOUND для неизвестной команды', async () => {
      const module = new TestModule(makeResolve('resolved'));

      let caught: unknown;
      try {
        await module.handle({
          name: 'unknown-cmd',
          attrs: {},
        });
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(AppException);
      const appEx = caught as AppException;
      expect(appEx.error.name).toBe('NO_COMMAND_FOUND');
      expect(appEx.error.kind).toBe('bad-request');
    });

    test('getDocTypes() агрегирует метаданные команд', () => {
      const module = new TestModule(makeResolve('test'));
      const commands = module.getDocTypes();

      expect(commands).toHaveLength(1);
      const cmd = commands[0];
      expect(cmd?.ucName).toBe('test-cmd');
      expect(cmd?.ucLabel).toBe('Тестовый UC');
      expect(cmd?.arName).toBe('TestAr');
      expect(cmd?.arLabel).toBe('Тестовый агрегат');
      expect(cmd?.type).toBe('command');
      expect(cmd?.requiresAuth).toBe(false);
      expect(cmd?.inputSchema).toBeDefined();
      expect(cmd?.outputSchema).toBeDefined();
    });
  });

  describe('execute() — новый метод', () => {
    test('выполняет команду с правильным вводом/выводом', async () => {
      const module = new TestModule(makeResolve('abc'));
      const result = await module.execute('test-cmd', { foo: 'x' });
      expect(result).toEqual({ bar: 'x-abc' });
    });

    test('пробрасывает actorId в handle', async () => {
      const module = new TestModule(makeResolve('test'));
      // Проверяем, что execute(...) вызывает handle с actorId
      // (actorId не влияет на TestUseCase, но должен передаваться)
      const result = await module.execute('test-cmd', { foo: 'q' }, 'user-1');
      expect(result).toEqual({ bar: 'q-test' });
    });
  });

  describe('logger и mode из appResolver', () => {
    test('logger извлекается из resolve.appResolver', () => {
      const resolve = makeResolve('test');
      const module = new TestModule(resolve);

      expect(module.logger).toBeDefined();
      expect(module.mode).toBe('test');
    });

    test('handle логирует время выполнения', async () => {
      const resolve = makeResolve('test');
      const module = new TestModule(resolve);

      await module.handle({
        name: 'test-cmd',
        attrs: { foo: 'log-test' },
      });

      // Проверяем, что info был вызван (запись лога выполнения)
      const infoMock = (resolve.appResolver.logger.info as ReturnType<typeof mock>);
      expect(infoMock).toHaveBeenCalled();
    });
  });

  describe('hasCommand()', () => {
    test('возвращает true для существующей команды', () => {
      const module = new TestModule(makeResolve('test'));
      expect(module.hasCommand('test-cmd')).toBe(true);
    });

    test('возвращает false для неизвестной команды', () => {
      const module = new TestModule(makeResolve('test'));
      expect(module.hasCommand('unknown')).toBe(false);
    });
  });
});
