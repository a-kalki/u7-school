import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { AppException } from "#domain/errors/errors";
import type { AutoUiApp } from "../app/auto-ui-app";
import { formatValibotErrors } from "./format-valibot-errors";
import type * as v from "valibot";

/**
 * Контроллер для работы с AutoUiApp через консоль (REPL).
 */
export class AutoUiConsoleController {
  constructor(private readonly app: AutoUiApp) {}

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
      await this.safeHandle("/app");

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
          await this.safeHandle(trimmedLine);
          process.stdout.write("\n> ");
        } else {
          // В режиме буферизации
          if (trimmedLine === "") {
            // Пустая строка — сигнал к выполнению накопленного
            await this.safeHandle(buffer.join("\n"));
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

  /**
   * Безопасно выполняет handleInput и форматирует возможные ошибки.
   */
  private async safeHandle(text: string): Promise<void> {
    try {
      const response = await this.app.handleInput(text);
      console.log(`\n${response}`);
    } catch (err) {
      console.log(`\n${this.formatError(err)}`);
    }
  }

  /**
   * Форматирует ошибку для вывода в консоль.
   * Для ошибок валидации использует formatValibotErrors.
   */
  private formatError(err: unknown): string {
    if (err instanceof AppException) {
      const { error } = err;

      // Ошибки валидации — форматируем через Valibot issues
      if (error.kind === "validation") {
        const payload = error.payload as
          | { rawIssues?: v.BaseIssue<unknown>[] }
          | undefined;

        if (payload?.rawIssues && payload.rawIssues.length > 0) {
          return formatValibotErrors(payload.rawIssues);
        }
      }

      // Остальные AppException — просто сообщение
      return `**Ошибка:** ${error.message}`;
    }

    // Обычные ошибки
    return `**Ошибка выполнения:** ${(err as Error).message || String(err)}`;
  }
}
