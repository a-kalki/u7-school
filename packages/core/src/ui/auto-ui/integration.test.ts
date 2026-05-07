import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as v from "valibot";
import { Module } from "#api/module/module";
import { UseCase } from "#api/uc/use-case";
import { AutoUiApp } from "./auto-ui-app";
import { AutoUiModule } from "./auto-ui-module";

// 1. Доменный слой (API)
class CreateCourseUseCase extends UseCase<any, any> {
  commandName = "create-course" as const;
  description = "Создать новый курс" as const;
  arName = "course" as const;
  arLabel = "Курс" as const;
  type = "command" as const;
  requiresAuth = false as const;
  inputSchema = v.object({ title: v.string(), description: v.string() });
  outputSchema = v.any();

  protected async getUser(_userId: string): Promise<Record<string, unknown>> {
    return {};
  }

  protected async checkPolicy(
    _command: unknown,
    _actor: unknown,
  ): Promise<void> {
    // Доступно всем
  }

  protected async execute(payload: any) {
    return { id: "123", title: payload.title };
  }
}

class CourseApiModule extends Module<any, any> {
  name = "courses" as const;
  useCases = [new CreateCourseUseCase()];
}

// 2. UI слой
class CourseUiModule extends AutoUiModule<{
  name: "courses";
  url: "/courses";
}> {
  override name = "courses" as const;
}

describe("AutoUI Integration", () => {
  const testDir = path.join(__dirname, "test-integration");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(
      path.join(testDir, "about.md"),
      "# School App\nMain welcome",
    );

    const modDir = path.join(testDir, "courses");
    await fs.mkdir(modDir, { recursive: true });
    await fs.writeFile(
      path.join(modDir, "about.md"),
      "# Courses Module\nModule welcome",
    );
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("полный сценарий навигации и выполнения команды", async () => {
    const apiModule = new CourseApiModule();
    apiModule.init({});

    const uiModule = new CourseUiModule({
      aboutPath: path.join(testDir, "courses"),
      apiModule,
    });

    const app = new AutoUiApp([uiModule], { aboutPath: testDir });
    await app.init();

    // 1. Главная
    let response = await app.handleInput("/app");
    expect(response).toContain("School App");
    expect(response).toContain("/modules");

    // 2. Список модулей
    response = await app.handleInput("/modules");
    expect(response).toContain("Courses Module");
    expect(response).toContain("/courses");

    // 3. Модуль
    response = await app.handleInput("/courses");
    expect(response).toContain("Module welcome");
    expect(response).toContain("/courses/aggregates");

    // 4. Агрегаты
    response = await app.handleInput("/courses/aggregates");
    expect(response).toContain("Курс (course): /courses/course");

    // 5. UseCase List
    response = await app.handleInput("/courses/course");
    expect(response).toContain(
      "Создать новый курс: /courses/course/create-course",
    );

    // 6. UseCase Prompt
    response = await app.handleInput("/courses/course/create-course");
    expect(response).toContain('Для выполнения команды "Создать новый курс"');

    // 7. Execute (с заглушкой маппинга)
    const input = "/courses/course/create-course\n- JS Basics\n- Learn JS";
    response = await app.handleInput(input);
    expect(response).toContain("**Успех!**");
    expect(response).toContain("JS Basics");
  });
});
