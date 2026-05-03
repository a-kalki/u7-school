import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { UseCase } from "./use-case";
import type { UcMeta } from "./use-case";
import type { ApiError } from "../../domain/errors/errors";
import { AppException } from "../../domain/errors/errors";

interface TestUcError extends ApiError {
  name: "TestUcError";
  kind: "bad-request";
}

interface TestUcMeta extends UcMeta {
  commandName: "test-cmd";
  input: { foo: string };
  output: { bar: string };
  errors: TestUcError;
}

class TestUseCase extends UseCase<TestUcMeta, { test: boolean }> {
  readonly commandName = "test-cmd";
  readonly inputSchema = v.object({ foo: v.string() });

  execute(command: { foo: string }) {
    if (command.foo === "bad") {
      this.throwBadRequest("TestUcError", "Bad input");
    }
    return { bar: "ok-" + String(this.resolve.test) };
  }
}

describe("UseCase (Phase 3)", () => {
  test("use-case валидирует команду через схему", async () => {
    const uc = new TestUseCase();
    uc.init({ test: true });

    let caught: unknown;
    try {
      await uc.handle({ foo: 123 }); // invalid type
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.kind).toBe("validation");
    expect(appEx.error.name).toBe("ValidationError");
  });

  test("use-case имеет доступ к резолверу модуля и возвращает результат", async () => {
    const uc = new TestUseCase();
    uc.init({ test: true });

    const result = await uc.handle({ foo: "good" });
    expect(result.bar).toBe("ok-true");
  });

  test("use-case выбрасывает ошибку через свой хелпер из бизнес-логики", async () => {
    const uc = new TestUseCase();
    uc.init({ test: true });

    let caught: unknown;
    try {
      await uc.handle({ foo: "bad" });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.name).toBe("TestUcError");
    expect(appEx.error.kind).toBe("bad-request");
  });
});
