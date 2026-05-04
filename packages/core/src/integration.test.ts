import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { Aggregate } from "./domain/ar/aggregate";
import type { ArMeta } from "./domain/ar/aggregate";
import type { DomainError } from "./domain/errors/errors";
import { UseCase } from "./api/uc/use-case";
import type { UcMeta } from "./api/uc/use-case";
import { Module } from "./api/module/module";
import type { ModuleMeta } from "./domain/module/types";
import { createCliController } from "./api/controller/cli";

// 1. Domain
interface InvalidNameError extends DomainError {
  name: "INVALID_NAME";
  kind: "validation";
}

interface DemoUserArMeta extends ArMeta {
  name: "User";
  errors: InvalidNameError;
}

class DemoUserAr extends Aggregate<DemoUserArMeta> {
  constructor(private name: string) {
    super();
  }

  validateName() {
    if (this.name.length < 3) {
      this.throwInvariant(
        { minLen: 3, actual: this.name.length },
        "Имя пользователя должно быть не короче 3 символов"
      );
    }
  }

  toSnapshot() {
    return { name: this.name };
  }
}

// 2. Application
interface DemoCreateUserUcMeta extends UcMeta {
  commandName: "demo.create-user";
  input: { name: string };
  output: { id: string; name: string };
  errors: InvalidNameError;
}

class DemoCreateUserUC extends UseCase<DemoCreateUserUcMeta, { db: any[] }> {
  readonly commandName = "demo.create-user";
  readonly inputSchema = v.object({
    name: v.string(),
  });

  execute(command: { name: string }) {
    const user = new DemoUserAr(command.name);
    user.validateName(); // Могут выброситься доменные ошибки

    const snapshot = user.toSnapshot();
    
    // Эмулируем сохранение в БД через резолвер
    this.resolve.db.push(snapshot);

    return {
      id: `user-${this.resolve.db.length}`,
      name: snapshot.name,
    };
  }
}

// 3. Module
interface DemoModuleMeta extends ModuleMeta {
  name: "Demo";
  url: "/api/demo";
}

class DemoModule extends Module<DemoModuleMeta, { db: any[] }> {
  readonly name = "Demo";
  readonly useCases = [new DemoCreateUserUC()];
}

// Tests
describe("Integration: Core Framework", () => {
  test("Полный сценарий: CLI -> Module -> UseCase -> Успешный ответ", async () => {
    const db: any[] = [];
    const module = new DemoModule();
    module.init({ db });

    const cli = createCliController(module);
    const result = await cli.run(["demo.create-user", '{"name": "Ivan"}']);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: "user-1", name: "Ivan" });
    }
    expect(db).toHaveLength(1);
    expect(db[0].name).toBe("Ivan");
  });

  test("Сценарий с ошибкой агрегата: контроллер корректно её ловит и форматирует", async () => {
    const db: any[] = [];
    const module = new DemoModule();
    module.init({ db });

    const cli = createCliController(module);
    // Имя "Bo" короче 3 символов, должно выбросить ошибку
    const result = await cli.run(["demo.create-user", '{"name": "Bo"}']);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe("internal"); // Агрегат бросает throwInvariant -> kind: internal
      expect(result.error.name).toBe("AR_INVARIANT_ERROR");
      expect(result.error.message).toBe("Имя пользователя должно быть не короче 3 символов");
      expect(result.error.payload).toEqual({ minLen: 3, actual: 2 });
    }
    expect(db).toHaveLength(0);
  });

  test("demo-модуль возвращает список команд через getCommands()", () => {
    const module = new DemoModule();
    const commands = module.getCommands();
    
    expect(commands).toHaveLength(1);
    expect(commands[0]?.commandName).toBe("demo.create-user");
    expect(commands[0]?.inputSchema).toBeDefined();
  });
});
