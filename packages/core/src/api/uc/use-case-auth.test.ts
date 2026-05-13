import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import type { AccessDeniedError } from "#domain/errors/errors";
import { AppException } from "#domain/errors/errors";
import type { ArMeta } from "#domain/ar/aggregate";
import { Aggregate } from "#domain/ar/aggregate";
import type { UcMeta } from "./use-case";
import { UseCase } from "./use-case";

type AuthTestError = AccessDeniedError<"AuthTestError">;

interface TestArMeta extends ArMeta {
  name: "TestAr";
  label: "Тестовый агрегат";
  state: { uuid: string; createdAt: string; updatedAt?: string } & Record<string, unknown>;
}

class TestAr extends Aggregate<TestArMeta> {
  static readonly arName = "TestAr";
  static readonly arLabel = "Тестовый агрегат";
}

interface AuthUcMeta {
  ucName: "test-auth";
  arMeta: TestArMeta;
  input: { data: string };
  output: { result: string };
  errors: AuthTestError;
  requiresAuth: boolean;
  type: "command" | "query";
}

/** UseCase, требующий авторизацию */
class AuthRequiredUseCase extends UseCase<AuthUcMeta, { prefix: string }> {
  protected readonly ucName = "test-auth" as const;
  protected readonly ucLabel = "Тестовый UC с авторизацией";
  protected readonly arMeta = { arName: "TestAr" as const, arLabel: "Тестовый агрегат" as const };
  protected readonly type = "command" as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = v.object({ data: v.string() });
  protected readonly outputSchema = v.object({ result: v.string() });

  protected async getUser(_userId: string): Promise<Record<string, unknown>> {
    return { id: _userId };
  }

  execute(command: { data: string }, actorId: string) {
    return { result: `${this.resolve.prefix}:${actorId}:${command.data}` };
  }
}

/** UseCase без авторизации */
class AuthOptionalUseCase extends UseCase<AuthUcMeta, { prefix: string }> {
  protected readonly ucName = "test-auth" as const;
  protected readonly ucLabel = "Тестовый UC без авторизации";
  protected readonly arMeta = { arName: "TestAr" as const, arLabel: "Тестовый агрегат" as const };
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = v.object({ data: v.string() });
  protected readonly outputSchema = v.object({ result: v.string() });

  protected async getUser(_userId: string): Promise<Record<string, unknown>> {
    return { id: _userId };
  }

  execute(command: { data: string }, actorId?: string) {
    return {
      result: `${this.resolve.prefix}:${actorId ?? "anon"}:${command.data}`,
    };
  }
}

describe("UseCase: авторизация", () => {
  test("requiresAuth=true требует actorId, иначе выбрасывает ошибку", async () => {
    const uc = new AuthRequiredUseCase();
    uc.init({ prefix: "ok" });

    let caught: unknown;
    try {
      await uc.handle({ data: "test" }); // без actorId
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.kind).toBe("unauthorized");
    expect(appEx.error.name).toBe("UNAUTHORIZED_ERROR");
  });

  test("requiresAuth=true с actorId выполняется успешно", async () => {
    const uc = new AuthRequiredUseCase();
    uc.init({ prefix: "ok" });

    const result = await uc.handle({ data: "test" }, "user-1");
    expect(result.result).toBe("ok:user-1:test");
  });

  test("requiresAuth=false работает без actorId", async () => {
    const uc = new AuthOptionalUseCase();
    uc.init({ prefix: "ok" });

    const result = await uc.handle({ data: "test" });
    expect(result.result).toBe("ok:anon:test");
  });
});

describe("UseCase: метаданные", () => {
  test("UseCase.getDocType() возвращает полные метаданные", () => {
    const uc = new AuthRequiredUseCase();
    const cmd = uc.getDocType();

    expect(cmd.ucName).toBe("test-auth");
    expect(cmd.ucLabel).toBe("Тестовый UC с авторизацией");
    expect(cmd.arName).toBe("TestAr");
    expect(cmd.arLabel).toBe("Тестовый агрегат");
    expect(cmd.type).toBe("command");
    expect(cmd.requiresAuth).toBe(true);
    expect(cmd.inputSchema).toBeDefined();
    expect(cmd.outputSchema).toBeDefined();
  });
});
