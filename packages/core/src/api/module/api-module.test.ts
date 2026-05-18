import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import type { UcMeta } from '#api/uc/use-case';
import { UseCase } from '#api/uc/use-case';
import type { ArMeta } from '#domain/ar/aggregate';
import { AppException, type NoCommandFoundError } from '#domain/errors/errors';
import type { ApiModuleMeta } from '#domain/types';
import { ApiModule } from './api-module';

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

class TestUseCase extends UseCase<TestUcMeta, { value: string }> {
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

interface TestModuleMeta extends ApiModuleMeta {
  name: 'TestModule';
  url: '/test';
  ucMetas: TestUcMeta;
}

class TestModule extends ApiModule<TestModuleMeta, { value: string }> {
  readonly name = 'TestModule';
  readonly useCases = [new TestUseCase()];

  constructor(resolve: { value: string }) {
    super();
    this.initResolve(resolve);
  }
}

describe('Module (Phase 4)', () => {
  test("модуль инициализируется с резолвером и передаёт его use-case'ам", async () => {
    const module = new TestModule({ value: 'resolved' });

    const result = await module.handle({
      name: 'test-cmd',
      attrs: { foo: 'hello' },
    });

    expect(result).toEqual({ bar: 'hello-resolved' });
  });

  test('модуль выбрасывает ошибку NO_COMMAND_FOUND для неизвестной команды', async () => {
    const module = new TestModule({ value: 'resolved' });

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
    const payload = appEx.error.payload as NoCommandFoundError['payload'];
    expect(payload.commandName).toBe('unknown-cmd');
    expect(payload.moduleName).toBe('TestModule');
  });

  test('модуль возвращает список команд (getCommands)', () => {
    const module = new TestModule({ value: "test" });
    const commands = module.getDocTypes();
    expect(commands).toHaveLength(1);
    expect(commands[0]?.ucName).toBe('test-cmd');
    expect(commands[0]?.inputSchema).toBeDefined();
  });

  test('getCommands() агрегирует полные метаданные от getCommand()', () => {
    const module = new TestModule({ value: "test" });
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
