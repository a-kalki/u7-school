import { describe, expect, it } from "bun:test";
import type { ModuleMeta } from "../../domain/module/types";
import type { UIAppResolver } from "../ui-base/ui-app";
import { AutoUiApp } from "./auto-ui-app";
import type { AutoUiModule, AutoUiModuleResolver } from "./auto-ui-module";
import type { UIIntent } from "./command-parser";

type GeneralAutoUiModule = AutoUiModule<
  ModuleMeta,
  UIAppResolver,
  AutoUiModuleResolver
>;

// Заглушка для AutoUiModule
class MockAutoUiModule {
  name = "testmod";
  about = { title: "Тестовый Модуль", body: "Описание модуля" };

  async init() { }

  async handleIntent(intent: UIIntent): Promise<string> {
    return `handled-${intent.type}`;
  }
}

describe("AutoUiApp", () => {
  it("должен рендерить about и список модулей", async () => {
    const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
    const app = new AutoUiApp([mockModule], { aboutPath: "mock" });
    app.about = { title: "Главное приложение", body: "Текст приложения" };

    const aboutResponse = await app.handleInput("/app");
    expect(aboutResponse).toContain("**Главное приложение**");
    expect(aboutResponse).toContain("Текст приложения");
    expect(aboutResponse).toContain("/modules");

    const modulesResponse = await app.handleInput("/modules");
    expect(modulesResponse).toContain("**Доступные модули:**");
    expect(modulesResponse).toContain("- Тестовый Модуль: /testmod");
  });

  it("должен маршрутизировать команды в модуль", async () => {
    const mockModule = new MockAutoUiModule() as unknown as GeneralAutoUiModule;
    const app = new AutoUiApp([mockModule], { aboutPath: "mock" });

    const response = await app.handleInput("/testmod");
    expect(response).toBe("handled-module");
  });

  it("должен возвращать ошибку при неизвестном модуле", async () => {
    const app = new AutoUiApp([], { aboutPath: "mock" });

    const response = await app.handleInput("/unknownmod");
    expect(response).toContain("Ошибка: Модуль 'unknownmod' не найден");
  });
});
