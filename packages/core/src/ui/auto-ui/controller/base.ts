import type * as v from "valibot";
import { AppException } from "#domain/errors/errors";
import type { AutoUiApp } from "../app/auto-ui-app";
import { formatValibotErrors } from "./format-valibot-errors";

/**
 * Абстрактный контроллер для AutoUiApp.
 * Обеспечивает общую логику обработки ввода и форматирования ошибок,
 * без привязки к конкретному интерфейсу (консоль, бот и т.д.).
 *
 * НЕ содержит логики register/login/session — только чистая обработка ввода.
 */
export abstract class AutoUiController {
  constructor(protected readonly app: AutoUiApp) {}

  /**
   * Безопасно выполняет handleInput и форматирует возможные ошибки.
   * Возвращает строку с результатом или отформатированной ошибкой.
   */
  async safeHandle(text: string): Promise<string> {
    try {
      return await this.app.handleInput(text);
    } catch (err) {
      return this.formatError(err);
    }
  }

  /**
   * Форматирует ошибку для вывода пользователю.
   * Для ошибок валидации использует formatValibotErrors.
   */
  formatError(err: unknown): string {
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
