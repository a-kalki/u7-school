import { describe, expect, it } from "bun:test";
import { Module } from "#api/module/module";
import type { UcDocType, UcMeta, UseCase } from "#api/uc/use-case";
import { AutoUiModule } from "./auto-ui-module";

type TestModuleMeta = { name: "testmod"; url: "testurl" };

class TestApiModule extends Module<TestModuleMeta, Record<string, unknown>> {
  override name = "testmod" as const;
  override useCases: UseCase<UcMeta, Record<string, unknown>>[] = [];

  override getDocTypes(): UcDocType[] {
    return [
      {
        commandName: "uc1",
        description: "Первая команда",
        arName: "agg1",
        arLabel: "Агрегат 1",
        type: "command",
        requiresAuth: false,
        // biome-ignore lint/suspicious/noExplicitAny: reason
        inputSchema: {} as any,
        // biome-ignore lint/suspicious/noExplicitAny: reason
        outputSchema: {} as any,
      },
      {
        commandName: "uc2",
        description: "Вторая команда",
        arName: "agg2",
        arLabel: "Агрегат 2",
        type: "command",
        requiresAuth: false,
        // biome-ignore lint/suspicious/noExplicitAny: reason
        inputSchema: {} as any,
        // biome-ignore lint/suspicious/noExplicitAny: reason
        outputSchema: {} as any,
      },
    ];
  }
  override async handle(cmd: { name: string; attrs: { _rawPayload: string } }) {
    if (cmd.name === "uc1")
      return { success: true, received: cmd.attrs._rawPayload };
    throw new Error("Test error");
  }
}

class TestAutoUiModule extends AutoUiModule<
  TestModuleMeta,
  { aboutPath: "." },
  { aboutPath: "."; apiModule: TestApiModule }
> {
  name = "testmod" as const;
}

describe("auto-ui-module", () => {
  const apiModule = new TestApiModule();

  it("должен рендерить about", async () => {
    const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });
    mod.about = { title: "Тайтл", body: "Описание" }; // вместо init();

    const response = await mod.handleIntent({
      type: "module",
      moduleName: "testmod",
      command: "about",
    });
    expect(response).toContain("Тайтл");
    expect(response).toContain("/testmod/aggregates");
  });

  it("должен вычислять и рендерить список агрегатов", async () => {
    const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

    const response = await mod.handleIntent({
      type: "module",
      moduleName: "testmod",
      command: "aggregates",
    });
    expect(response).toContain("Агрегат 1 (agg1)");
    expect(response).toContain("/testmod/agg1");
    expect(response).toContain("Агрегат 2 (agg2)");
  });

  it("должен рендерить список usecase для агрегата", async () => {
    const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

    const response = await mod.handleIntent({
      type: "module",
      moduleName: "testmod",
      aggregateName: "agg1",
      command: "usecases",
    });
    expect(response).toContain("Первая команда");
    expect(response).toContain("/testmod/agg1/uc1");
    expect(response).not.toContain("Вторая команда");
  });

  it("должен генерировать prompt для usecase", async () => {
    const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

    const response = await mod.handleIntent({
      type: "usecase",
      moduleName: "testmod",
      aggregateName: "agg1",
      commandName: "uc1",
      action: "prompt",
    });
    expect(response).toContain('Для выполнения команды "Первая команда"');
    expect(response).toContain("/testmod/agg1/uc1");
  });

  it("должен выполнять usecase и возвращать результат", async () => {
    const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

    const response = await mod.handleIntent({
      type: "usecase",
      moduleName: "testmod",
      aggregateName: "agg1",
      commandName: "uc1",
      action: "execute",
      payload: ["val1", "val2"],
    });
    expect(response).toContain("Успех!");
    expect(response).toContain("val1");
    expect(response).toContain("val2");
  });

  it("должен перехватывать ошибки при выполнении usecase", async () => {
    const mod = new TestAutoUiModule({ aboutPath: ".", apiModule });

    const response = await mod.handleIntent({
      type: "usecase",
      moduleName: "testmod",
      aggregateName: "agg2",
      commandName: "uc2",
      action: "execute",
      payload: [],
    });
    expect(response).toContain("**Ошибка выполнения:** Test error");
  });
});
