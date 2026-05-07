import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import type { AutoUiApp } from "../app/auto-ui-app";

/**
 * Контроллер для работы с AutoUiApp через консоль (REPL).
 */
export class AutoUiConsoleController {
  constructor(private readonly app: AutoUiApp) { }

  /**
   * Запускает интерактивный цикл взаимодействия в консоли.
   */
  async run(): Promise<void> {
    const rl = readline.createInterface({
      input,
      output,
      terminal: true,
    });

    try {
      // 1. При начале работы выдаем приглашение из about.md
      const initialResponse = await this.app.handleInput("/app");
      console.log(`\n${initialResponse}`);

      let buffer: string[] = [];
      let isBuffering = false;

      process.stdout.write("\n> ");

      for await (const line of rl) {
        const trimmedLine = line.trim();

        if (trimmedLine === "/quit" || trimmedLine === "/exit") {
          console.log("До свидания!");
          break;
        }

        if (!isBuffering) {
          if (!trimmedLine) {
            process.stdout.write("> ");
            continue;
          }

          const parts = trimmedLine.split("/").filter(Boolean);
          // Если это путь к UseCase (3 части: /mod/agg/uc), начинаем буферизацию
          if (parts.length === 3 && trimmedLine.startsWith("/")) {
            buffer.push(trimmedLine);
            isBuffering = true;
            process.stdout.write("... "); // Индикатор ожидания параметров
            continue;
          }

          // Иначе выполняем мгновенно (навигация)
          const response = await this.app.handleInput(trimmedLine);
          console.log(`\n${response}`);
          process.stdout.write("\n> ");
        } else {
          // В режиме буферизации
          if (trimmedLine === "") {
            // Пустая строка — сигнал к выполнению накопленного
            const response = await this.app.handleInput(buffer.join("\n"));
            console.log(`\n${response}`);
            buffer = [];
            isBuffering = false;
            process.stdout.write("\n> ");
          } else {
            buffer.push(trimmedLine);
            process.stdout.write("... ");
          }
        }
      }
    } catch (err) {
      console.error(
        "\nКритическая ошибка консольного интерфейса:",
        (err as Error).message,
      );
    } finally {
      rl.close();
    }
  }
}
