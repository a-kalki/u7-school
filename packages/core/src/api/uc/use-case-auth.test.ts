import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import type { DomainError } from "../../domain/errors/errors";
import { AppException } from "../../domain/errors/errors";
import type { UcMeta } from "./use-case";
import { UseCase } from "./use-case";

interface AuthTestError extends DomainError {
  name: "AuthTestError";
  kind: "access-denied";
}

interface AuthUcMeta extends UcMeta {
  commandName: "test-auth";
  input: { data: string };
  output: { result: string };
  errors: AuthTestError;
}

/** UseCase, требующий авторизацию */
class AuthRequiredUseCase extends UseCase<AuthUcMeta, { prefix: string }> {
  protected readonly commandName = "test-auth";
  protected readonly description = "Тестовый UC с авторизацией";
  protected readonly arName = "TestAr";
  protected readonly arLabel = "Тестовый агрегат";
  protected readonly type = "command" as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = v.object({ data: v.string() });
  protected readonly outputSchema = v.object({ result: v.string() });

  execute(command: { data: string }, actorId: string) {
    return { result: `${this.resolve.prefix}:${actorId}:${command.data}` };
  }
}

/** UseCase без авторизации */
class AuthOptionalUseCase extends UseCase<AuthUcMeta, { prefix: string }> {
  protected readonly commandName = "test-auth";
  protected readonly description = "Тестовый UC без авторизации";
  protected readonly arName = "TestAr";
  protected readonly arLabel = "Тестовый агрегат";
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = v.object({ data: v.string() });
  protected readonly outputSchema = v.object({ result: v.string() });

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
  test("UseCase.getCommand() возвращает полные метаданные", () => {
    const uc = new AuthRequiredUseCase();
    const cmd = uc.getDocType();

    expect(cmd.commandName).toBe("test-auth");
    expect(cmd.description).toBe("Тестовый UC с авторизацией");
    expect(cmd.arName).toBe("TestAr");
    expect(cmd.arLabel).toBe("Тестовый агрегат");
    expect(cmd.type).toBe("command");
    expect(cmd.requiresAuth).toBe(true);
    expect(cmd.inputSchema).toBeDefined();
    expect(cmd.outputSchema).toBeDefined();
  });
});
