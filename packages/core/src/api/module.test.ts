import { describe, expect, test } from "bun:test";
import { Module } from "./module";
import type { ModuleCommand } from "./module";
import { UseCase } from "./uc/use-case";
import type { UcMeta } from "./uc/use-case";
import * as v from "valibot";
import { AppException } from "../domain/errors/errors";

interface TestUcMeta extends UcMeta {
  commandName: "test-cmd";
  input: { foo: string };
  output: { bar: string };
  errors: never;
}

class TestUseCase extends UseCase<TestUcMeta, { value: string }> {
  readonly commandName = "test-cmd";
  readonly inputSchema = v.object({ foo: v.string() });

  execute(command: { foo: string }) {
    return { bar: `${command.foo}-${this.resolve.value}` };
  }
}

class TestModule extends Module<{ value: string }> {
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
    expect((appEx.error.payload as any).commandName).toBe("unknown-cmd");
  });

  test("модуль возвращает список команд (getCommands)", () => {
    const module = new TestModule();
    const commands = module.getCommands();
    expect(commands).toHaveLength(1);
    expect(commands[0]?.commandName).toBe("test-cmd");
    expect(commands[0]?.inputSchema).toBeDefined();
  });
});
