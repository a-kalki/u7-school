import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { AppException } from "../../domain/errors/errors";
import type { DomainError } from "../../domain/errors/errors";
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
  readonly commandName = "test-auth";
  readonly description = "Тестовый UC с авторизацией";
  readonly aggregateName = "TestAr";
  readonly aggregateLabel = "Тестовый агрегат";
  readonly type = "command" as const;
  readonly requiresAuth = true as const;
  readonly inputSchema = v.object({ data: v.string() });
  readonly outputSchema = v.object({ result: v.string() });

  execute(command: { data: string }, actorId: string) {
    return { result: `${this.resolve.prefix}:${actorId}:${command.data}` };
  }
}

/** UseCase без авторизации */
class AuthOptionalUseCase extends UseCase<AuthUcMeta, { prefix: string }> {
  readonly commandName = "test-auth";
  readonly description = "Тестовый UC без авторизации";
  readonly aggregateName = "TestAr";
  readonly aggregateLabel = "Тестовый агрегат";
  readonly type = "query" as const;
  readonly requiresAuth = false as const;
  readonly inputSchema = v.object({ data: v.string() });
  readonly outputSchema = v.object({ result: v.string() });

  execute(command: { data: string }, actorId?: string) {
    return { result: `${this.resolve.prefix}:${actorId ?? "anon"}:${command.data}` };
  }
}

/** UseCase с кастомной проверкой авторизации */
class CustomAuthUseCase extends UseCase<AuthUcMeta, { prefix: string }> {
  readonly commandName = "test-auth";
  readonly description = "Тестовый UC с кастомной авторизацией";
  readonly aggregateName = "TestAr";
  readonly aggregateLabel = "Тестовый агрегат";
  readonly type = "command" as const;
  readonly requiresAuth = true as const;
  readonly inputSchema = v.object({ data: v.string() });
  readonly outputSchema = v.object({ result: v.string() });

  protected override checkAuth(actorId?: string): void {
    if (actorId !== "admin") {
      this.throwAccessDenied("AuthTestError", "Только администратор");
    }
  }

  execute(command: { data: string }, actorId: string) {
    return { result: `${this.resolve.prefix}:${actorId}:${command.data}` };
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
    expect(appEx.error.kind).toBe("access-denied");
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

  test("checkAuth() можно переопределить", async () => {
    const uc = new CustomAuthUseCase();
    uc.init({ prefix: "ok" });

    // admin проходит
    const result = await uc.handle({ data: "test" }, "admin");
    expect(result.result).toBe("ok:admin:test");
  });

  test("переопределённый checkAuth() отклоняет неавторизованных", async () => {
    const uc = new CustomAuthUseCase();
    uc.init({ prefix: "ok" });

    let caught: unknown;
    try {
      await uc.handle({ data: "test" }, "user"); // не admin
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.kind).toBe("access-denied");
    expect(appEx.error.message).toBe("Только администратор");
  });
});

describe("UseCase: метаданные", () => {
  test("UseCase содержит description, aggregateName, aggregateLabel, type", () => {
    const uc = new AuthRequiredUseCase();

    expect(uc.description).toBe("Тестовый UC с авторизацией");
    expect(uc.aggregateName).toBe("TestAr");
    expect(uc.aggregateLabel).toBe("Тестовый агрегат");
    expect(uc.type).toBe("command");
  });

  test("UseCase.getCommand() возвращает полные метаданные", () => {
    const uc = new AuthRequiredUseCase();
    const cmd = uc.getCommand();

    expect(cmd.commandName).toBe("test-auth");
    expect(cmd.description).toBe("Тестовый UC с авторизацией");
    expect(cmd.aggregateName).toBe("TestAr");
    expect(cmd.aggregateLabel).toBe("Тестовый агрегат");
    expect(cmd.type).toBe("command");
    expect(cmd.requiresAuth).toBe(true);
    expect(cmd.inputSchema).toBeDefined();
    expect(cmd.outputSchema).toBeDefined();
  });

  test("getInputSchema() удалён из UseCase", () => {
    const uc = new AuthRequiredUseCase();
    // @ts-expect-error getInputSchema не должен существовать
    expect(uc.getInputSchema).toBeUndefined();
  });
});
