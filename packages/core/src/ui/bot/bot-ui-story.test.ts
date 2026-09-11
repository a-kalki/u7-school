import { describe, expect, test } from 'bun:test';
import {
  errAccessDenied,
  errBadRequest,
  errConflict,
  errInternal,
  errNotFound,
  errUnauthorized,
  errValidation,
} from '#domain/errors/error-helpers';
import { AppException } from '#domain/errors/errors';
import type { AppMeta } from '#domain/types';
import type { Logger } from '#shared/logger';
import { setGlobalLogger } from '#shared/logger';
import { md, type mdRaw } from '../../shared/markdown';
import { assertMarkdownV2Safe } from '../../shared/markdown-validator';
import { BotUiStory } from './bot-ui-story';
import type { BotSession, BotUpdate, DialogResponse } from './types';

type TestActor = { id: string };

/** Логгер-шпион warn-вызовов (остальное — молчаливые заглушки). */
function makeWarnSpyLogger(
  warns: Array<[string, string, Record<string, unknown> | undefined]>,
): Logger {
  return {
    debug() {},
    info() {},
    warn(source, message, meta) {
      warns.push([source, message, meta]);
    },
    error() {},
    setLogLevel() {},
    getLogLevel() {
      return 0;
    },
    setSourceLevel() {},
  };
}

/** Логгер-шпион error-вызовов (остальное — молчаливые заглушки). */
function makeErrorSpyLogger(errors: unknown[]): Logger {
  return {
    debug() {},
    info() {},
    warn() {},
    error(_source, _message, meta) {
      errors.push(meta);
    },
    setLogLevel() {},
    getLogLevel() {
      return 0;
    },
    setSourceLevel() {},
  };
}

/** Стори-заглушка: открывает protected API (confirm/handleError). */
class TestStory extends BotUiStory<AppMeta, TestActor> {
  readonly name = 'anketa';

  override async handleCallback(
    _action: string,
    _actor: { id: string },
    _session: BotSession,
  ): Promise<DialogResponse> {
    return {};
  }
  // handleMessage НЕ переопределена: наследуем дефолт ядра (реплика-отказ)

  // Экспонирование protected для тестов
  callConfirm(
    action: string,
    targetId: string,
    text: ReturnType<typeof mdRaw>,
    opts?: Parameters<TestStory['confirm']>[3],
  ): ReturnType<TestStory['confirm']> {
    return this.confirm(action, targetId, text, opts);
  }
  callHandleError(err: unknown): ReturnType<TestStory['handleError']> {
    return this.handleError(err);
  }
  callErrorNotify(err: unknown): ReturnType<TestStory['errorNotify']> {
    return this.errorNotify(err);
  }
  callCb(action: string, ...ids: string[]): string {
    return this.cb(action, ...ids);
  }
  callCbFor(story: string, action: string, ...ids: string[]): string {
    return this.cbFor(story, action, ...ids);
  }
  callStripPrefix(data: string): string {
    return this.stripPrefix(data);
  }
  callUnknownCommand(
    action: string,
    actor: TestActor,
    session: BotSession,
  ): ReturnType<TestStory['unknownCommand']> {
    return this.unknownCommand(action, actor, session);
  }
  callFormatDate(iso: string): string {
    return this.formatDate(iso);
  }
}

describe('BotUiStory — confirm', () => {
  test('строит confirm-экран: кнопки подтверждения и отмены с кодами', () => {
    const story = new TestStory();

    const response = story.callConfirm(
      'complete',
      'uuid-123',
      md`Завершить шаг?`,
    );

    const row = response.screen?.keyboard?.rows[0];
    expect(row?.length).toBe(2);
    expect(row?.[0]).toEqual({
      text: '✅ Да',
      code: 'anketa:complete-confirm:uuid-123',
    });
    expect(row?.[1]).toEqual({
      text: '❌ Отмена',
      code: 'anketa:detail:uuid-123',
    });
    expect(String(response.screen?.text)).toBe('Завершить шаг?');
    expect(response.screen?.keyboard?.isMultiple).toBe(false);
  });

  test('опции: custom-кнопки, cancelCode, extraData', () => {
    const story = new TestStory();

    const response = story.callConfirm('remove', 'id-9', md`Точно?`, {
      confirmButton: '🔥 Снять',
      cancelButton: '◀️ Назад к списку',
      cancelCode: 'anketa:list',
      extraData: 'force',
    });

    const row = response.screen?.keyboard?.rows[0];
    expect(row?.[0]).toEqual({
      text: '🔥 Снять',
      code: 'anketa:remove-confirm:id-9:force',
    });
    expect(row?.[1]).toEqual({ text: '◀️ Назад к списку', code: 'anketa:list' });
  });

  test('confirm-текст — валидный MarkdownV2 с доменными данными', () => {
    const story = new TestStory();
    const dangerous = 'Имя с *спец*символами _и_ [скобками]';

    const response = story.callConfirm('act', 'id', md`Удалить ${dangerous}?`);

    // интерполяция экранирована: литерал целиком валиден
    expect(() =>
      assertMarkdownV2Safe(response.screen?.text ?? ''),
    ).not.toThrow();
    expect(String(response.screen?.text)).toContain(
      'Имя с \\*спец\\*символами',
    );
  });
});

describe('BotUiStory — дефолты контракта команд (ФР-4, pipe)', () => {
  // Ядро имён команд не знает: именных обработчиков нет,
  // дефолт на любую команду — pass («не моё»).
  test("handleCommand по умолчанию: любая команда → {reaction: 'pass'}", async () => {
    const story = new TestStory();

    for (const command of ['cancel', 'help', 'start', 'tasks']) {
      const reaction = await story.handleCommand(
        { type: 'command', command, args: '', telegramId: 7 },
        { id: 'u' },
        { dialog: { path: 'x/y', seq: 1 } },
      );
      expect(reaction).toEqual({ reaction: 'pass' });
    }
  });

  test('handleMessage по умолчанию: warn + реплика-отказ + release (самоликвидация зависшего ввода)', async () => {
    const warns: Array<[string, string, Record<string, unknown> | undefined]> =
      [];
    setGlobalLogger(makeWarnSpyLogger(warns));
    const story = new TestStory();
    const update: BotUpdate = {
      type: 'message',
      text: 'привет',
      telegramId: 7,
    };

    const response = await story.handleMessage(
      update,
      { id: 'u' },
      {
        dialog: { path: 'x/anketa', seq: 3, input: {} },
      },
    );

    // Недостижимый при корректной стори путь — warn разработчику...
    expect(warns.length).toBe(1);
    expect(warns[0]?.[1]).toContain('handleMessage');
    expect(warns[0]?.[2]).toMatchObject({
      story: 'anketa',
      dialogPath: 'x/anketa',
    });
    // ...и явная реплика пользователю (экран не трогает) + release:
    // контекст ввода сброшен, пользователь выведен из зависшего ожидания
    expect(Object.keys(response)).toEqual(['notify', 'release']);
    expect(response.release).toBe(true);
    expect(String(response.notify?.text)).toBe(
      'Извините, на данном этапе сообщения не принимаются\\.',
    );
    setGlobalLogger(undefined as unknown as Logger);
  });
});

describe('BotUiStory — handleError', () => {
  test('validation с issues → экран-список полей, валидный md', () => {
    const story = new TestStory();

    const response = story.callHandleError(
      new AppException(
        errValidation('VALIDATION', 'Некорректные данные', {
          issues: [
            { path: 'Имя', message: 'слишком *короткое*' },
            { path: 'Email', message: 'невалиден' },
          ],
        }),
      ),
    );

    const text = String(response.screen?.text);
    expect(text).toContain('Имя');
    expect(text).toContain('слишком \\*короткое\\*');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test('validation без issues → общий экран валидации', () => {
    const story = new TestStory();

    const response = story.callHandleError(
      new AppException(
        errValidation('VALIDATION', 'Что-то не так (скобки) [тут]', undefined),
      ),
    );

    const text = String(response.screen?.text);
    expect(text).toContain('Что\\-то не так \\(скобки\\)');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test.each([
    [
      'not-found',
      new AppException(errNotFound('ERR', 'Объект [не] найден_', undefined)),
      'Объект',
    ],
    [
      'conflict',
      new AppException(errConflict('ERR', 'Конфликт [x] _y_', undefined)),
      'Конфликт',
    ],
    [
      'access-denied',
      new AppException(errAccessDenied('ERR', 'Доступ (закрыт)', undefined)),
      'Доступ',
    ],
    [
      'bad-request',
      new AppException(errBadRequest('ERR', 'Плохой запрос _[1]', undefined)),
      'Плохой',
    ],
  ])('%s → экран с текстом ошибки, валидный md', (_kind, error, snippet) => {
    const story = new TestStory();

    const response = story.callHandleError(error);

    const text = String(response.screen?.text);
    expect(text).toContain(snippet);
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test.each([
    [
      'internal',
      new AppException(errInternal('ERR', 'boom [x] _y_', undefined)),
    ],
    ['unauthorized', new AppException(errUnauthorized('ERR', 'нет доступа'))],
  ])('%s → общий экран, доменные данные не утекают', (_kind, error) => {
    const story = new TestStory();

    const response = story.callHandleError(error);

    const text = String(response.screen?.text);
    expect(text).not.toContain('внутренняя деталь');
    expect(text).not.toContain('boom');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });
});

describe('BotUiStory — errorExitRows (кнопки выхода на экранах ошибок, §10.20)', () => {
  /** Стори с кнопкой выхода на экранах ошибок. */
  class ExitStory extends TestStory {
    protected override errorExitRows(): { text: string; code: string }[][] {
      return [[{ text: '⬅️ Меню', code: 'app:main-menu' }]];
    }
  }

  test('хук подставляет кнопки во все виды экранов ошибок', () => {
    const story = new ExitStory();

    const validation = story.callHandleError(
      new AppException(
        errValidation('V', 'Некорректные данные', {
          issues: [{ path: 'Имя', message: 'короткое' }],
        }),
      ),
    );
    const validationNoIssues = story.callHandleError(
      new AppException(errValidation('V', 'Что-то не так', undefined)),
    );
    const notFound = story.callHandleError(
      new AppException(errNotFound('E', 'Объект не найден', undefined)),
    );
    const internal = story.callHandleError(
      new AppException(errInternal('E', 'boom', undefined)),
    );

    const expected = [[{ text: '⬅️ Меню', code: 'app:main-menu' }]];
    for (const response of [
      validation,
      validationNoIssues,
      notFound,
      internal,
    ]) {
      expect(response.screen?.keyboard?.rows).toEqual(expected);
      expect(response.screen?.keyboard?.isMultiple).toBe(false);
      expect(() =>
        assertMarkdownV2Safe(String(response.screen?.text)),
      ).not.toThrow();
    }
  });

  test('без переопределения — экраны ошибок без клавиатуры, по умолчанию', () => {
    const story = new TestStory();

    const response = story.callHandleError(
      new AppException(errNotFound('E', 'Объект не найден', undefined)),
    );

    expect(response.screen?.keyboard).toBeUndefined();
  });
});

describe('BotUiStory — errorNotify (ФР-5)', () => {
  test('validation с issues → warn-реплика со списком полей, без экрана', () => {
    const story = new TestStory();

    const response = story.callErrorNotify(
      new AppException(
        errValidation('VALIDATION', 'Некорректные данные', {
          issues: [
            { path: 'Email', message: 'невалиден' },
            { path: 'Имя', message: 'слишком *короткое*' },
          ],
        }),
      ),
    );

    // Реплика, а не экран: экран диалога не захвачен
    expect(response.screen).toBeUndefined();
    // Ввод не снят и не переустановлен — awaitInput-контекст живёт (переспрос)
    expect(response.release).toBeUndefined();
    expect(response.awaitInput).toBeUndefined();
    expect(response.notify?.kind).toBe('warn');
    const text = String(response.notify?.text);
    expect(text).toContain('Email');
    expect(text).toContain('невалиден');
    expect(text).toContain('слишком \\*короткое\\*');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test.each([
    [
      'not-found',
      new AppException(errNotFound('ERR', 'Объект [не] найден_', undefined)),
      'Объект',
    ],
    [
      'conflict',
      new AppException(errConflict('ERR', 'Конфликт [x] _y_', undefined)),
      'Конфликт',
    ],
    [
      'bad-request',
      new AppException(errBadRequest('ERR', 'Плохой запрос _[1]', undefined)),
      'Плохой',
    ],
  ])('%s → warn-реплика с текстом ошибки, без экрана', (_kind, error, snippet) => {
    const story = new TestStory();

    const response = story.callErrorNotify(error);

    expect(response.screen).toBeUndefined();
    expect(response.notify?.kind).toBe('warn');
    const text = String(response.notify?.text);
    expect(text).toContain(snippet);
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test('internal → общее сообщение, доменные данные не утекают, error-лог', () => {
    const errors: unknown[] = [];
    setGlobalLogger(makeErrorSpyLogger(errors));
    const story = new TestStory();

    const response = story.callErrorNotify(
      new AppException(
        errInternal('ERR', 'boom [секретная деталь] _y_', undefined),
      ),
    );

    expect(response.screen).toBeUndefined();
    expect(response.notify?.kind).toBe('warn');
    const text = String(response.notify?.text);
    expect(text).not.toContain('boom');
    expect(text).not.toContain('секретная деталь');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
    expect(errors.length).toBe(1);
    setGlobalLogger(undefined as unknown as Logger);
  });
});

describe('BotUiStory — колбэк-хелперы', () => {
  test('cb: story:action:ids без префикса контроллера', () => {
    const story = new TestStory();
    expect(story.callCb('view', 'id-1', 'id-2')).toBe('anketa:view:id-1:id-2');
  });

  test('cbFor: чужая стори того же контроллера', () => {
    const story = new TestStory();
    expect(story.callCbFor('list', 'open', 'x')).toBe('list:open:x');
  });

  test('stripPrefix снимает префикс только своей стори', () => {
    const story = new TestStory();
    expect(story.callStripPrefix('anketa:view:1')).toBe('view:1');
    expect(story.callStripPrefix('other:view:1')).toBe('other:view:1');
  });

  test('formatDate: ISO → дд.мм.гггг', () => {
    const story = new TestStory();
    expect(story.callFormatDate('2026-09-05T00:00:00Z')).toBe('05.09.2026');
  });
});

// Нужен для типизации update в будущих кейсах (сохраняем поверхность)
describe('BotUiStory — поверхность', () => {
  test('unknownCommand: экран + warn-лог с кодом и контекстом', () => {
    const warns: Array<[string, string, Record<string, unknown> | undefined]> =
      [];
    setGlobalLogger(makeWarnSpyLogger(warns));
    const story = new TestStory();
    const session: BotSession = { dialog: { path: 'quest/anketa', seq: 2 } };

    const response = story.callUnknownCommand('boom:1', { id: 'u9' }, session);

    expect(String(response.screen?.text)).toContain('Неизвестная команда');
    expect(warns.length).toBe(1);
    expect(warns[0]?.[0]).toBe('bot');
    expect(warns[0]?.[2]).toMatchObject({
      code: 'anketa:boom:1',
      dialogPath: 'quest/anketa',
      actor: { id: 'u9' },
    });
    setGlobalLogger(undefined as unknown as Logger);
  });

  test('handleCallback переопределён, handleMessage — дефолт ядра', async () => {
    const story = new TestStory();
    const session: BotSession = { dialog: { path: 'c/anketa', seq: 1 } };
    const update: BotUpdate = { type: 'message', text: 'текст', telegramId: 1 };

    expect(await story.handleCallback('view', { id: 'u' }, session)).toEqual(
      {},
    );
    // Дефолт — реплика-отказ (контракт «обязана ответить» соблюдён ядром)
    expect(
      (await story.handleMessage(update, { id: 'u' }, session)).notify?.text,
    ).toContain('не принимаются');
  });
});
