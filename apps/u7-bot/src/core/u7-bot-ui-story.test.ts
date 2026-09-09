import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
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
import {
  assertMarkdownV2Safe,
  type Logger,
  LogLevel,
  type MdText,
  md,
  setGlobalLogger,
} from '@u7-scl/core/shared';
import type {
  BotSession,
  BotUpdate,
  CommandUpdate,
  DialogResponse,
} from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { APP_CODES } from '../shared/app-codes';
import { U7BotController } from './u7-bot-controller';
import { U7BotUiStory } from './u7-bot-ui-story';

/**
 * Заглушка для доступа к protected методу handleError.
 */
class TestStory extends U7BotUiStory {
  readonly name = 'test-handle-error';

  override handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: BotSession,
  ): Promise<DialogResponse> {
    throw new Error('Method not implemented.');
  }

  handleCallback(): Promise<DialogResponse> {
    throw new Error('Не используется');
  }

  /** Экспонируем protected handleError */
  testHandleError(err: unknown): DialogResponse {
    return this.handleError(err);
  }
}

const actor: User = {
  uuid: 'u1',
  name: 'Тест',
  telegramId: 1,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

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

describe('U7BotUiStory.handleError', () => {
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
    test('возвращает экран с перечислением полей', () => {
      const appError = errValidation(
        'CreateStreamValidationError',
        'Ошибка валидации',
        {
          issues: [
            { path: 'title', message: 'Обязательное поле' },
            { path: 'startDate', message: 'Некорректный формат даты' },
          ],
        },
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(resp.screen).toBeDefined();
      expect(String(resp.screen!.text)).toContain('title');
      expect(String(resp.screen!.text)).toContain('startDate');
      expect(String(resp.screen!.text)).toContain('Обязательное поле');
      expect(String(resp.screen!.text)).toContain('Некорректный формат даты');
    });

    test('валидация без issues — показывает общее сообщение', () => {
      const appError = errValidation(
        'GenericValidationError',
        'Что-то не так',
        undefined as unknown as Record<string, unknown>,
      );
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(resp.screen).toBeDefined();
      expect(String(resp.screen!.text)).toContain('Что\\-то не так');
    });
  });

  describe('not-found error', () => {
    test('возвращает экран ошибки', () => {
      const exception = new AppException(
        errNotFound('ModuleNotFound', 'Модуль не найден', undefined),
      );

      const resp = story.testHandleError(exception);

      expect(String(resp.screen!.text)).toContain('Модуль не найден');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('conflict error', () => {
    test('возвращает экран ошибки', () => {
      const exception = new AppException(
        errConflict('StreamAlreadyExists', 'Поток уже существует', undefined),
      );

      const resp = story.testHandleError(exception);

      expect(String(resp.screen!.text)).toContain('Поток уже существует');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('access-denied error', () => {
    test('возвращает экран ошибки', () => {
      const exception = new AppException(
        errAccessDenied('AccessDenied', 'Недостаточно прав', undefined),
      );

      const resp = story.testHandleError(exception);

      expect(String(resp.screen!.text)).toContain('Недостаточно прав');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('bad-request error', () => {
    test('возвращает экран ошибки', () => {
      const exception = new AppException(
        errBadRequest('BadRequest', 'Некорректный запрос', undefined),
      );

      const resp = story.testHandleError(exception);

      expect(String(resp.screen!.text)).toContain('Некорректный запрос');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('internal error', () => {
    test('логирует и возвращает общий экран', () => {
      const exception = new AppException(
        errInternal('ServerError', 'Внутренняя ошибка сервера', undefined),
      );

      const resp = story.testHandleError(exception);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(String(resp.screen!.text)).toContain('внутренняя ошибка');
      expect(String(resp.screen!.text)).not.toContain(
        'Внутренняя ошибка сервера',
      );
    });
  });

  describe('unauthorized error', () => {
    test('логирует и возвращает общий экран', () => {
      const exception = new AppException(
        errUnauthorized('Unauthorized', 'Не авторизован'),
      );

      const resp = story.testHandleError(exception);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(String(resp.screen!.text)).not.toContain('Не авторизован');
    });
  });

  describe('обычный Error (не AppException)', () => {
    test('логирует и возвращает общий экран', () => {
      const err = new Error('Что-то пошло не так');

      const resp = story.testHandleError(err);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(String(resp.screen!.text)).toContain('внутренняя ошибка');
      expect(String(resp.screen!.text)).not.toContain('Что-то пошло не так');
    });
  });

  describe('неизвестный тип ошибки', () => {
    test('логирует и возвращает общий экран', () => {
      const resp = story.testHandleError('странная строка');

      expect(mockLogger.error).toHaveBeenCalled();
      expect(String(resp.screen!.text)).toContain('внутренняя ошибка');
    });
  });

  // Инцидент 2026-09-03: неэкранированная точка в fallback-тексте внутренней ошибки
  // роняла MarkdownV2-валидатор → сообщение об ошибке не отправлялось вовсе.
  // Новый контракт: MdText-тексты, валидируются транспортом (assertDialogResponseMarkdownSafe).
  describe('MarkdownV2-безопасность текста', () => {
    test('internal: fallback-текст проходит assertMarkdownV2Safe', () => {
      const exception = new AppException(
        errInternal('ServerError', 'Внутренняя ошибка сервера', undefined),
      );

      const resp = story.testHandleError(exception);

      expect(() => assertMarkdownV2Safe(resp.screen!.text)).not.toThrow();
    });

    test('validation с issues: path и message с точками/скобками экранированы', () => {
      const appError = errValidation('ValidationError', 'Ошибка валидации', {
        issues: [
          { path: 'title', message: 'Поле "title" обязательно (см. пример).' },
          {
            path: 'startDate',
            message: 'Некорректный формат даты [дд.мм.гггг]',
          },
        ],
      });
      const exception = new AppException(appError);

      const resp = story.testHandleError(exception);

      expect(() => assertMarkdownV2Safe(resp.screen!.text)).not.toThrow();
    });

    test('validation без issues: message с точкой проходит assertMarkdownV2Safe', () => {
      const exception = new AppException(
        errValidation(
          'GenericValidationError',
          'Некорректное значение поля (см. инструкцию).',
          undefined as unknown as Record<string, unknown>,
        ),
      );

      const resp = story.testHandleError(exception);

      expect(() => assertMarkdownV2Safe(resp.screen!.text)).not.toThrow();
    });
  });

  describe('наследник U7BotUiStory', () => {
    test('menuButtons по умолчанию — пусто (стори не участвует в меню)', () => {
      const s = new TestStory();
      expect(s.menuButtons(actor)).toEqual([]);
    });

    test('экран ошибки содержит кнопку «⬅️ Меню» с кодом из APP_CODES (§10.20)', () => {
      const resp = story.testHandleError(
        new AppException(
          errNotFound('ModuleNotFound', 'Модуль не найден', undefined),
        ),
      );

      expect(resp.screen?.keyboard?.rows).toEqual([
        [{ text: '⬅️ Меню', code: APP_CODES.mainMenu }],
      ]);
    });
  });
});

// ── Кнопки выхода на экранах ошибок прикладного слоя (§10.20) ──

describe('U7BotController — errorExitRows (§10.20)', () => {
  /** Стори, кидающая ошибку из callback — контроллер построит экран ошибки. */
  class ThrowingStory extends U7BotUiStory {
    readonly name = 'boom';

    override handleCallback(): Promise<DialogResponse> {
      throw new AppException(
        errNotFound('StreamNotFound', 'Поток не найден', undefined),
      );
    }
  }

  class ThrowingController extends U7BotController {
    readonly name = 'streams';

    constructor(story: U7BotUiStory) {
      super();
      this.stories.push(story);
    }
  }

  test('экран ошибки контроллера содержит кнопку «⬅️ Меню» с кодом из APP_CODES', async () => {
    setGlobalLogger(createMockLogger());
    const ctrl = new ThrowingController(new ThrowingStory());
    ctrl.init({
      appApi: {} as never,
      eventBus: {} as never,
      actorResolver: async () => actor,
    } as never);

    const resp = await ctrl.handleCallback('boom:open', actor, {
      dialog: { path: 'streams/boom', seq: 1 },
    });

    expect(String(resp.screen?.text)).toContain('Поток не найден');
    expect(resp.screen?.keyboard?.rows).toEqual([
      [{ text: '⬅️ Меню', code: APP_CODES.mainMenu }],
    ]);
  });
});

// ── Контракт команд u7-стори (ФР-4, ревизия 2.1) ──

describe('U7BotUiStory — контракт handleCommand', () => {
  /** Стори с контекстной справкой и счётчиком сброса. */
  class ContractStory extends U7BotUiStory {
    readonly name = 'fill';
    resetCalls = 0;
    help: MdText | null = null;

    override reset(): void {
      this.resetCalls++;
    }

    override handleCallback(): Promise<DialogResponse> {
      throw new Error('Не используется');
    }
    // handleMessage не переопределена — дефолт ядра (реплика-отказ)
    override async contextHelp(): Promise<MdText | null> {
      return this.help;
    }
  }

  class ContractController extends U7BotController {
    readonly name = 'questionnaire';

    constructor(story: U7BotUiStory) {
      super();
      this.stories.push(story);
    }
  }

  /** Инициализированная пара контроллер+стори (dialogPath = ctrl/story). */
  function makeStory(): ContractStory {
    const story = new ContractStory();
    const ctrl = new ContractController(story);
    ctrl.init({
      appApi: {} as never,
      eventBus: {} as never,
      actorResolver: async () => actor,
    } as never);
    return story;
  }

  function cmd(command: string): CommandUpdate {
    return { type: 'command', command, args: '', telegramId: 1 };
  }

  const activeSession: BotSession = {
    dialog: { path: 'questionnaire/fill', seq: 2 },
  };
  const otherSession: BotSession = { dialog: { path: 'app/menu', seq: 2 } };

  test('dialogPath вычисляется из контроллера и имени стори', () => {
    const story = makeStory();
    expect(story.dialogPath).toBe('questionnaire/fill');
  });

  test('isActive: свой диалог — true, чужой/закрытый — false', () => {
    const story = makeStory();
    expect(story.isActive(activeSession)).toBe(true);
    expect(story.isActive(otherSession)).toBe(false);
    expect(story.isActive({} as BotSession)).toBe(false);
  });

  test('/start → исключение-сторож: команда обрабатывается uiApp, до стори не доходит', async () => {
    const story = makeStory();
    await expect(
      story.handleCommand(cmd('start'), actor, activeSession),
    ).rejects.toThrow();
  });

  test('/help → pass: команда обрабатывает uiApp, до pipe не доходит', async () => {
    const story = makeStory();
    story.help = md`Справка анкеты`;

    const reaction = await story.handleCommand(
      cmd('help'),
      actor,
      activeSession,
    );

    // Ни активная, ни неактивная стори в /help не вовлечены — даже со справкой
    expect(reaction).toEqual({ reaction: 'pass' });
  });

  test('contextHelp по умолчанию — null (uiApp уйдёт в общий help)', async () => {
    class BareStory extends U7BotUiStory {
      readonly name = 'bare';
      override handleCallback(): Promise<DialogResponse> {
        throw new Error('Не используется');
      }
    }
    const bare = new BareStory();

    expect(await bare.contextHelp(actor, activeSession)).toBeNull();
  });

  test('/cancel активна → сброс себя + stop{notify: «Отменено. Наберите /start»}', async () => {
    const story = makeStory();

    const reaction = await story.handleCommand(
      cmd('cancel'),
      actor,
      activeSession,
    );

    expect(story.resetCalls).toBe(1);
    expect(reaction.reaction).toBe('stop');
    if (reaction.reaction === 'stop') {
      expect(String(reaction.response.notify?.text)).toContain('Отменено');
      // MarkdownV2-безопасность дефолтного текста
      expect(() =>
        assertMarkdownV2Safe(reaction.response.notify?.text ?? ''),
      ).not.toThrow();
    }
  });

  test('/cancel неактивна → pass без побочных действий (сброс только активной)', async () => {
    const story = makeStory();

    const reaction = await story.handleCommand(
      cmd('cancel'),
      actor,
      otherSession,
    );

    expect(story.resetCalls).toBe(0);
    expect(reaction).toEqual({ reaction: 'pass' });
  });

  test('прочая команда → pass (домен реагирует только своими командами)', async () => {
    const story = makeStory();

    const reaction = await story.handleCommand(
      cmd('tasks'),
      actor,
      activeSession,
    );

    expect(reaction).toEqual({ reaction: 'pass' });
  });
});
