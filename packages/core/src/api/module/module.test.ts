import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import {
  AppException,
  type NoCommandFoundError,
} from "../../domain/errors/errors";
import type { ModuleMeta } from "../../domain/module/types";
import type { UcMeta } from "../uc/use-case";
import { UseCase } from "../uc/use-case";
import { Module } from "./module";

interface TestUcMeta extends UcMeta {
  commandName: "test-cmd";
  input: { foo: string };
  output: { bar: string };
  errors: never;
}

class TestUseCase extends UseCase<TestUcMeta, { value: string }> {
  readonly commandName = "test-cmd";
  readonly description = "Тестовый UC";
  readonly arName = "TestAr";
  readonly arLabel = "Тестовый агрегат";
  readonly type = "command" as const;
  readonly requiresAuth = false as const;
  readonly inputSchema = v.object({ foo: v.string() });
  readonly outputSchema = v.object({ bar: v.string() });

  protected async getUser(_userId: string): Promise<Record<string, unknown>> {
    return {};
  }

  protected async checkPolicy(
    _command: unknown,
    _actor: unknown,
  ): Promise<void> {
    // Доступно всем
  }

  execute(command: { foo: string }) {
    return { bar: `${command.foo}-${this.resolve.value}` };
  }
}

interface TestModuleMeta extends ModuleMeta {
  name: "TestModule";
  url: "/test";
}

class TestModule extends Module<TestModuleMeta, { value: string }> {
  readonly name = "TestModule";
  readonly useCases = [new TestUseCase()];
}

describe("Module (Phase 4)", () => {
  test("модуль инициализируется с резолвером и передаёт его use-case'ам", async () => {
    const module = new TestModule();
    module.init({ value: "resolved" });

    const result = await module.handle({
      name: "test-cmd",
      attrs: { foo: "hello" },
    });

    expect(result).toEqual({ bar: "hello-resolved" });
  });

  test("модуль выбрасывает ошибку NO_COMMAND_FOUND для неизвестной команды", async () => {
    const module = new TestModule();
    module.init({ value: "resolved" });

    let caught: unknown;
    try {
      await module.handle({
        name: "unknown-cmd",
        attrs: {},
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.name).toBe("NO_COMMAND_FOUND");
    expect(appEx.error.kind).toBe("bad-request");
    const payload = appEx.error.payload as NoCommandFoundError["payload"];
    expect(payload.commandName).toBe("unknown-cmd");
    expect(payload.moduleName).toBe("TestModule");
  });

  test("модуль возвращает список команд (getCommands)", () => {
    const module = new TestModule();
    const commands = module.getDocTypes();
    expect(commands).toHaveLength(1);
    expect(commands[0]?.commandName).toBe("test-cmd");
    expect(commands[0]?.inputSchema).toBeDefined();
  });

  test("getCommands() агрегирует полные метаданные от getCommand()", () => {
    const module = new TestModule();
    const commands = module.getDocTypes();

    expect(commands).toHaveLength(1);
    const cmd = commands[0];
    expect(cmd?.commandName).toBe("test-cmd");
    expect(cmd?.description).toBe("Тестовый UC");
    expect(cmd?.arName).toBe("TestAr");
    expect(cmd?.arLabel).toBe("Тестовый агрегат");
    expect(cmd?.type).toBe("command");
    expect(cmd?.requiresAuth).toBe(false);
    expect(cmd?.inputSchema).toBeDefined();
    expect(cmd?.outputSchema).toBeDefined();
  });
});
