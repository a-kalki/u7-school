import { AppException } from '#domain/errors/errors';

/**
 * Сериализует любую ошибку в плоский Record<string, unknown>,
 * пригодный для передачи в meta-параметр логгера.
 *
 * Извлекает максимум деталей:
 * - AppException → name, kind, level, payload (включая issues валидации)
 * - Error        → message, stack, cause
 * - Прочие       → значение как строка
 *
 * Используй в обработчиках ошибок вместо String(err).
 *
 * @example
 * logger.error('bot', 'Ошибка', serializeError(err));
 */
export function serializeError(err: unknown): Record<string, unknown> {
  // 1. AppException — обёртка над AppError
  if (err instanceof AppException) {
    const ae = err.error;
    const result: Record<string, unknown> = {
      message: ae.message,
      name: ae.name,
      level: ae.level,
      kind: ae.kind,
    };

    // payload может содержать issues валидации
    if (ae.payload !== undefined) {
      const pl = ae.payload as Record<string, unknown>;
      result.payload = pl;

      // InputValidationError / OutputValidationError: плоский список ошибок
      if (pl.issues && Array.isArray(pl.issues)) {
        result.issues = pl.issues;
      }
    }

    return result;
  }

  // 2. Обычный Error
  if (err instanceof Error) {
    const result: Record<string, unknown> = {
      message: err.message,
      name: err.name,
    };
    if (err.stack) result.stack = err.stack;

    // cause (может быть вложенным Error)
    if (err.cause) {
      result.cause =
        err.cause instanceof Error ? err.cause.message : String(err.cause);
    }

    return result;
  }

  // 3. Всё остальное
  return { error: String(err) };
}
