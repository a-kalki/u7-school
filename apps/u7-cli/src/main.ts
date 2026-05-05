import { 
  AutoUiApp, 
  AutoUiModule, 
  Module, 
  UseCase, 
  AutoUiConsoleController,
  type UIAppResolver,
  type AutoUiModuleResolver
} from "@u7/core";
import * as v from "valibot";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// --- Demo Domain Module ---

class GreetUseCase extends UseCase<any, any> {
  commandName = "greet" as const;
  description = "Поприветствовать пользователя" as const;
  aggregateName = "system" as const;
  aggregateLabel = "Система" as const;
  type = "query" as const;
  requiresAuth = false as const;
  inputSchema = v.object({ name: v.string() });
  outputSchema = v.any();
  
  protected async execute(payload: { name: string }) {
    return { message: `Привет, ${payload.name}!` };
  }
}

class DemoApiModule extends Module<any, any> {
  name = "demo" as const;
  useCases = [new GreetUseCase()];
}

// --- Demo UI Module ---

class DemoUiModule extends AutoUiModule<{ name: "demo"; url: "/demo" }> {
  name = "demo" as const;
}

// --- Main ---

async function main() {
  const apiModule = new DemoApiModule();
  apiModule.init({}); // No dependencies for now

  // Create module about.md
  const demoModDir = path.join(rootDir, "demo-module");
  await fs.mkdir(demoModDir, { recursive: true });
  await fs.writeFile(path.join(demoModDir, "about.md"), "# Демо модуль\nЭто демонстрационный модуль для проверки CLI.");

  const uiModule = new DemoUiModule({
    aboutPath: demoModDir,
    apiModule
  });

  const app = new AutoUiApp([uiModule], {
    aboutPath: rootDir // path to apps/u7-cli/about.md
  });

  await app.init();

  const controller = new AutoUiConsoleController(app);
  await controller.run();
}

main().catch(console.error);
