import { describe, expect, it } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import type { UIAppResolver } from "./ui-app";
import { UIModule, type UIModuleResolver } from "./ui-module";

class TestUIModule extends UIModule<
  { name: "mock"; url: "/mock" },
  UIAppResolver,
  UIModuleResolver
> {
  name = "mock" as const;

  render(): string {
    return "rendered";
  }

  renderUseCase(ucName: string): string {
    return `rendered-uc-${ucName}`;
  }
}

describe("ui-module (Базовый UI-модуль)", () => {
  it("должен инициализироваться и загружать about.md", async () => {
    const testDir = path.join(__dirname, "test-module");
    await fs.promises.mkdir(testDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(testDir, "about.md"),
      "# Mock Module\nЭто мок-модуль для тестирования.",
    );

    const uiModule = new TestUIModule({
      aboutPath: testDir,
    });

    await uiModule.init({ aboutPath: "." });

    expect(uiModule.about?.title).toBe("Mock Module");
    expect(uiModule.about?.body).toBe("Это мок-модуль для тестирования.");
    expect(uiModule.appResolver).toEqual({ aboutPath: "." });
    expect(uiModule.name).toBe("mock");

    // Очистка
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  it("должен выбрасывать ошибку без about.md", async () => {
    const uiModule = new TestUIModule({
      aboutPath: __dirname,
    });

    expect(uiModule.init({ aboutPath: "." })).rejects.toThrow();
  });
});
