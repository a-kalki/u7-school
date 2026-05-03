import { describe, expect, test } from "bun:test";
import type { ApiError } from "../../domain/errors/errors";
import { AppException } from "../../domain/errors/errors";
import type { UcMeta } from "./use-case";
import { UseCase } from "./use-case";

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

class TestUseCase extends UseCase<TestUcMeta> {
  execute(command: { foo: string }) {
    if (command.foo === "bad") {
      this.throwBadRequest("TestUcError", "Bad input", "foo is bad");
    }
    return { bar: "ok" };
  }
}

describe("UseCase (Phase 2)", () => {
  test("метод use-case выбрасывает ошибку из объявленного пула", () => {
    const uc = new TestUseCase();

    let caught: unknown;
    try {
      uc.execute({ foo: "bad" });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.name).toBe("TestUcError");
  });
});
