import { describe, expect, test } from "bun:test";
import { createCliController } from "./cli";
import { Module } from "../module/module";
import { UseCase } from "../uc/use-case";
import type { UcMeta } from "../uc/use-case";
import type { ModuleMeta } from "../../domain/module/types";
import * as v from "valibot";

interface TestUcMeta extends UcMeta {
  commandName: "test-cmd";
  input: { foo: string };
  output: { bar: string };
  errors: never;
}

class TestUseCase extends UseCase<TestUcMeta, { test: boolean }> {
  readonly commandName = "test-cmd";
  readonly inputSchema = v.object({ foo: v.string() });

  execute(command: { foo: string }) {
    if (command.foo === "crash") {
      throw new Error("Unexpected crash");
    }
    return { bar: `ok-${command.foo}` };
  }
}

interface TestModuleMeta extends ModuleMeta {
  name: "TestModule";
  url: "/test";
}

class TestModule extends Module<TestModuleMeta, { test: boolean }> {
  readonly name = "TestModule";
  readonly useCases = [new TestUseCase()];
}

describe("CLI Controller", () => {
  test("успешное выполнение команды возвращает success: true", async () => {
    const module = new TestModule();
    module.init({ test: true });
    const controller = createCliController(module);

    const result = await controller.run(["test-cmd", '{"foo": "hello"}']);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ bar: "ok-hello" });
    }
  });

  test("команда с невалидным JSON возвращает ошибку (ApiError/internal)", async () => {
    const module = new TestModule();
    module.init({ test: true });
    const controller = createCliController(module);

    const result = await controller.run(["test-cmd", '{bad json}']);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe("internal");
      expect(result.error.name).toBe("UnknownError");
    }
  });

  test("неизвестная команда возвращает bad-request от модуля", async () => {
    const module = new TestModule();
    module.init({ test: true });
    const controller = createCliController(module);

    const result = await controller.run(["unknown-cmd"]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe("bad-request");
      expect(result.error.name).toBe("NO_COMMAND_FOUND");
    }
  });

  test("невалидные параметры возвращают ошибку валидации от use-case", async () => {
    const module = new TestModule();
    module.init({ test: true });
    const controller = createCliController(module);

    // foo ожидается строкой, передаем число
    const result = await controller.run(["test-cmd", '{"foo": 123}']);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe("validation");
      expect(result.error.name).toBe("COMMAND_VALIDATION_ERROR");
    }
  });

  test("необработанное исключение внутри use-case возвращается как UnknownError", async () => {
    const module = new TestModule();
    module.init({ test: true });
    const controller = createCliController(module);

    const result = await controller.run(["test-cmd", '{"foo": "crash"}']);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe("internal");
      expect(result.error.name).toBe("UnknownError");
    }
  });
});
