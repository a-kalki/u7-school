import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import type { BadRequestError } from "#domain/errors/errors";
import { AppException } from "#domain/errors/errors";
import type { ArMeta } from "#domain/ar/aggregate";
import { Aggregate } from "#domain/ar/aggregate";
import type { UcMeta } from "./use-case";
import { UseCase } from "./use-case";

type OutputTestError = BadRequestError<"OutputTestError">;

interface TestArMeta extends ArMeta {
  name: "TestAr";
  label: "Тестовый агрегат";
  state: { uuid: string; createdAt: string; updatedAt?: string } & Record<string, unknown>;
}

class TestAr extends Aggregate<TestArMeta> {
  static readonly arName = "TestAr";
  static readonly arLabel = "Тестовый агрегат";
}

interface OutputTestUcMeta {
  ucName: "test-output";
  arMeta: TestArMeta;
  input: { foo: string };
  output: { bar: string; count: number };
  errors: OutputTestError;
  requiresAuth: false;
  type: "command";
}

class ValidOutputUseCase extends UseCase<OutputTestUcMeta, { prefix: string }> {
  protected readonly ucName = "test-output" as const;
  protected readonly ucLabel = "Тестовый UC с валидацией выхода";
  protected readonly arMeta = { arName: "TestAr" as const, arLabel: "Тестовый агрегат" as const };
  protected readonly type = "command" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = v.object({ foo: v.string() });
  protected readonly outputSchema = v.object({
    bar: v.string(),
    count: v.number(),
  });

  protected async getUser(_userId: string): Promise<Record<string, unknown>> {
    return {};
  }

  execute(command: { foo: string }) {
    return {
      bar: `${this.resolve.prefix}-${command.foo}`,
      count: command.foo.length,
    };
  }
}

class InvalidOutputUseCase extends UseCase<
  OutputTestUcMeta,
  { prefix: string }
> {
  protected readonly ucName = "test-output" as const;
  protected readonly ucLabel = "Тестовый UC с невалидным выходом";
  protected readonly arMeta = { arName: "TestAr" as const, arLabel: "Тестовый агрегат" as const };
  protected readonly type = "command" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = v.object({ foo: v.string() });
  protected readonly outputSchema = v.object({
    bar: v.string(),
    count: v.number(),
  });

  protected async getUser(_userId: string): Promise<Record<string, unknown>> {
    return {};
  }

  execute() {
    // Возвращаем невалидный output (count — строка вместо числа)
    return { bar: "bad", count: "not-a-number" } as unknown as {
      bar: string;
      count: number;
    };
  }
}

describe("UseCase: output validation", () => {
  test("валидирует корректный output через outputSchema", async () => {
    const uc = new ValidOutputUseCase();
    uc.init({ prefix: "ok" });

    const result = await uc.handle({ foo: "hello" });

    expect(result.bar).toBe("ok-hello");
    expect(result.count).toBe(5);
  });

  test("при невалидном output выбрасывает internal error", async () => {
    const uc = new InvalidOutputUseCase();
    uc.init({ prefix: "ok" });

    let caught: unknown;
    try {
      await uc.handle({ foo: "hello" });
      expect("this").toBe("not be call");
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.kind).toBe("internal");
    expect(appEx.error.name).toBe("OUTPUT_VALIDATION_ERROR");
  });

  test("handle() вызывает цепочку validateInput → execute → validateOutput", async () => {
    const uc = new ValidOutputUseCase();
    uc.init({ prefix: "chain" });

    const result = await uc.handle({ foo: "link" });

    expect(result.bar).toBe("chain-link");
    expect(result.count).toBe(4);
  });
});
