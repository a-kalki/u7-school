import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
  AppException,
  errAccessDenied,
  errBadRequest,
  errConflict,
  errInternal,
  errNotFound,
  errUnauthorized,
  errValidation,
} from '@u7-scl/core/domain';
import type { BotResponse } from '@u7-scl/core/ui';
import { type Logger, LogLevel, setGlobalLogger } from '@u7-scl/core/shared';
import type { StreamApiModuleMeta } from '@u7-scl/stream/domain';
import { U7BotUserStory } from './u7-bot-user-story';

/**
 * Заглушка для доступа к protected методу handleError.
 */
class TestStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'test-handle-error';

  handleCallback(): Promise<BotResponse> {
    throw new Error('Не используется');
  }

  /** Экспонируем protected handleError */
  testHandleError(err: unknown): BotResponse {
    return this.handleError(err);
  }
}

/** Создаёт мок-логгер */
function createMockLogger(): Logger & { error: ReturnType<typeof mock> } {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    setLogLevel: mock(() => {}),
    getLogLevel: mock(() => LogLevel.DEBUG),
    setSourceLevel: mock(() => {}),
  } as unknown as Logger & { error: ReturnType<typeof mock> };
}

describe('U7BotUserStory.handleError', () => {
  let story: TestStory;
  let mockLogger: Logger & { error: ReturnType<typeof mock> };

  beforeEach(() => {
    story = new TestStory();
    mockLogger = createMockLogger();
    setGlobalLogger(mockLogger);
  });

  afterEach(() => {
    // Сбрасываем глобальный логгер, чтобы не влиять на другие тесты
  });

  describe('validation error', () => {
    test('возвращает сообщение с перечислением полей', () => {
      const appError = errValidation(
        'CreateStreamValidationError',
        'Ошибка валидации',
        {
          issues: [
            { field: 'title', message: 'Обязательное поле' },
            { field: 'startDate', message: 'Некорректный формат даты' },
          ],
        },
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(resp.sendMessage).toBeDefined();
      expect(resp.sendMessage!.text).toContain('title');
      expect(resp.sendMessage!.text).toContain('startDate');
      expect(resp.sendMessage!.text).toContain('Обязательное поле');
      expect(resp.sendMessage!.text).toContain('Некорректный формат даты');
    });

    test('валидация без issues — показывает общее сообщение', () => {
      const appError = errValidation(
        'GenericValidationError',
        'Что-то не так',
        undefined as unknown as Record<string, unknown>,
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(resp.sendMessage).toBeDefined();
      expect(resp.sendMessage!.text).toContain('Что-то не так');
    });
  });

  describe('not-found error', () => {
    test('возвращает сообщение ошибки', () => {
      const appError = errNotFound(
        'ModuleNotFound',
        'Модуль не найден',
        undefined as unknown as undefined,
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(resp.sendMessage).toBeDefined();
      expect(resp.sendMessage!.text).toContain('Модуль не найден');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('conflict error', () => {
    test('возвращает сообщение ошибки', () => {
      const appError = errConflict(
        'StreamAlreadyExists',
        'Поток уже существует',
        undefined as unknown as undefined,
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(resp.sendMessage!.text).toContain('Поток уже существует');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('access-denied error', () => {
    test('возвращает сообщение ошибки', () => {
      const appError = errAccessDenied(
        'AccessDenied',
        'Недостаточно прав',
        undefined as unknown as undefined,
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(resp.sendMessage!.text).toContain('Недостаточно прав');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('bad-request error', () => {
    test('возвращает сообщение ошибки', () => {
      const appError = errBadRequest(
        'BadRequest',
        'Некорректный запрос',
        undefined as unknown as undefined,
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(resp.sendMessage!.text).toContain('Некорректный запрос');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('internal error', () => {
    test('логирует и возвращает общее сообщение', () => {
      const appError = errInternal(
        'ServerError',
        'Внутренняя ошибка сервера',
        undefined as unknown as undefined,
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(resp.sendMessage!.text).toContain('внутренняя ошибка');
      expect(resp.sendMessage!.text).not.toContain('Внутренняя ошибка сервера');
    });
  });

  describe('unauthorized error', () => {
    test('логирует и возвращает общее сообщение', () => {
      const appError = errUnauthorized('Unauthorized', 'Не авторизован');
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(resp.sendMessage!.text).not.toContain('Не авторизован');
    });
  });

  describe('обычный Error (не AppException)', () => {
    test('логирует и возвращает общее сообщение', () => {
      const err = new Error('Что-то пошло не так');

      const resp = story.testHandleError(err);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(resp.sendMessage!.text).toContain('внутренняя ошибка');
      expect(resp.sendMessage!.text).not.toContain('Что-то пошло не так');
    });
  });

  describe('неизвестный тип ошибки', () => {
    test('логирует и возвращает общее сообщение', () => {
      const resp = story.testHandleError('странная строка');

      expect(mockLogger.error).toHaveBeenCalled();
      expect(resp.sendMessage!.text).toContain('внутренняя ошибка');
    });
  });
});
