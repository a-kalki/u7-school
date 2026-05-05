import { describe, expect, it } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { UIApp, type UIAppResolver } from "./ui-app";
import { UIModule } from "./ui-module";

interface TestAppResolver extends UIAppResolver {
  someAppService: boolean;
}

interface TestModuleResolver extends UIAppResolver {
  someModuleService: boolean;
}

class TestUIModule extends UIModule<
  { name: "mock"; url: "/mock" },
  TestAppResolver,
  TestModuleResolver
> {
  name = "mock" as const;

  render() {
    return "module";
  }
}

class TestUIApp extends UIApp<TestAppResolver> {
  render() {
    return "app";
  }
}

describe("ui-app (Базовое UI-приложение)", () => {
  it("должен инициализировать приложение и модули, а также загружать about.md", async () => {
    const testAppDir = path.join(__dirname, "test-app");
    const testModuleDir = path.join(testAppDir, "module");

    await fs.promises.mkdir(testModuleDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(testAppDir, "about.md"),
      "# Приложение\nОписание приложения.",
    );
    await fs.promises.writeFile(
      path.join(testModuleDir, "about.md"),
      "# Модуль\nОписание модуля.",
    );

    const uiModule = new TestUIModule({
      aboutPath: testModuleDir,
      someModuleService: true,
    });

    const uiApp = new TestUIApp([uiModule], {
      aboutPath: testAppDir,
      someAppService: true,
    });

    await uiApp.init();

    expect(uiApp.about?.title).toBe("Приложение");
    expect(uiApp.about?.body).toBe("Описание приложения.");

    expect(uiApp.modules.length).toBe(1);
    const module = uiApp.modules[0] as TestUIModule;
    expect(module.about?.title).toBe("Модуль");
    expect(module.about?.body).toBe("Описание модуля.");
    expect(module.appResolver.someAppService).toBe(true);

    // Очистка
    await fs.promises.rm(testAppDir, { recursive: true, force: true });
  });
});
