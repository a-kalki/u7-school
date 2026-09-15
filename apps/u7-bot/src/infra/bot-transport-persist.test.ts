import { describe, expect, mock, test } from 'bun:test';
import { JsonFileRepoError } from '@u7-scl/core/infra';
import { type Logger, mdRaw, setGlobalLogger } from '@u7-scl/core/shared';
import type {
  BotSession,
  BotSessionRepo,
  CommandUpdate,
  DialogResponse,
} from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { BotContext } from '../context';
import type { DialogUiAppPort } from './bot-transport';
import { BotTransport } from './bot-transport';

/**
 * Тесты персистентности транспорта (трек bot-ui-session-persist):
 * - in-memory-режим без repo — нынешнее поведение как дефолт;
 * - repo принимается через конструктор (опциональный 3-й аргумент).
 *
 * Синхронная запись/восстановление (интеграция) — отдельные фазы трека.
 */

// ── Фабрики (стиль bot-transport.test.ts) ──

let messageIdSeq = 0;

function makeMockBotApi(overrides: Record<string, unknown> = {}): Api {
  messageIdSeq = 0;
  return {
    sendMessage: mock(async () => ({ message_id: ++messageIdSeq })),
    editMessageText: mock(async () => ({ message_id: 1 })),
    banChatMember: mock(async () => true),
    unbanChatMember: mock(async () => true),
    ...overrides,
  } as unknown as Api;
}

function makeUiApp(overrides: Partial<DialogUiAppPort> = {}): DialogUiAppPort {
  return {
    handleCommand: mock(async () => null),
    handleCallback: mock(async () => ({ screen: { text: mdRaw('Ок') } })),
    handleMessage: mock(async () => ({ screen: { text: mdRaw('Принято') } })),
    ...overrides,
  } as unknown as DialogUiAppPort;
}

function makeCtx(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: { id: 123, first_name: 'Test', is_bot: false } as BotContext['from'],
    chat: { id: 123, type: 'private' } as BotContext['chat'],
    reply: mock(async () => ({ message_id: 99 })),
    answerCallbackQuery: mock(async () => true),
    callbackQuery: {
      data: 'app:menu:open',
    } as BotContext['callbackQuery'],
    message: { text: 'hello' } as BotContext['message'],
    ...overrides,
  } as unknown as BotContext;
}

/** Контекст со слэш-текстом (единственный вход команд — ФР-4). */
function makeCommandCtx(text: string, tgId = 123): BotContext {
  return makeCtx({
    from: { id: tgId, first_name: 'Test', is_bot: false } as BotContext['from'],
    message: { text } as BotContext['message'],
  });
}

function makeSessionRepo(
  sessions: Map<number, BotSession> = new Map(),
  shortIds: Map<string, string> = new Map(),
): BotSessionRepo {
  return {
    loadAll: mock(async () => sessions),
    save: mock(async () => {}),
    remove: mock(async () => {}),
    loadShortIds: mock(async () => shortIds),
    saveShortId: mock(async () => {}),
  };
}

function makeLogger(): Logger {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    setLogLevel: mock(() => {}),
    getLogLevel: mock(() => 0),
    setSourceLevel: mock(() => {}),
  } as unknown as Logger;
}

function kb(code: string, text = 'Кнопка') {
  return { rows: [[{ text, code }]], isMultiple: false };
}

type ApiMock = ReturnType<typeof mock>;

/** Все вызовы мока Grammy Api. */
function callsOf(m: unknown): unknown[][] {
  return (m as ApiMock).mock.calls as unknown[][];
}

/** Последний отправленный callback_data (первая кнопка последнего send). */
function lastSentCallbackData(api: Api): string | undefined {
  const last = callsOf(api.sendMessage).at(-1);
  return (
    last?.[2] as {
      reply_markup?: { inline_keyboard?: { callback_data?: string }[][] };
    }
  )?.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data;
}

/** Открытие диалога через /start (мок uiApp выставляет диалог). */
async function startDialog(
  bundle: { transport: BotTransport; uiApp: DialogUiAppPort; api: Api },
  opts: { seq?: number; code?: string } = {},
): Promise<string> {
  const code = opts.code ?? 'menu:open';
  bundle.uiApp.handleCommand = mock(
    async (_update: CommandUpdate, _tg: number, s: BotSession) => {
      s.dialog = { path: 'app/menu', seq: opts.seq ?? 5 };
      return {
        screen: { text: mdRaw('Меню'), keyboard: kb(code, '📂 Меню') },
      } satisfies DialogResponse;
    },
  );
  await bundle.transport.handleCommand(makeCommandCtx('/start'));
  const pressed = lastSentCallbackData(bundle.api);
  if (!pressed) throw new Error('welcome-экран не отправлен');
  return pressed;
}

function makeTransport(
  overrides: Partial<DialogUiAppPort> = {},
  repo?: BotSessionRepo,
): { transport: BotTransport; uiApp: DialogUiAppPort; api: Api } {
  const api = makeMockBotApi();
  const uiApp = makeUiApp(overrides);
  const transport = repo
    ? new BotTransport(uiApp, api, repo)
    : new BotTransport(uiApp, api);
  return { transport, uiApp, api };
}

// ── In-memory без repo (дефолт) ──

describe('BotTransport — in-memory без repo (дефолт, трек persist)', () => {
  test('конструктор без repo: /start открывает диалог, штамп на кнопке', async () => {
    const bundle = makeTransport();
    const pressed = await startDialog(bundle);

    expect(pressed).toBe('menu:open:~5');
  });

  test('конструктор без repo: callback с валидным штампом доезжает до uiApp', async () => {
    const bundle = makeTransport();
    const pressed = await startDialog(bundle);

    await bundle.transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(bundle.uiApp.handleCallback)[0]?.[0]).toBe('menu:open');
  });

  test('in-memory-режим изолирован: сессии двух транспортов не пересекаются', async () => {
    const a = makeTransport();
    const b = makeTransport();
    await startDialog(a, { seq: 7 });
    await startDialog(b, { seq: 3 });

    // Штамп чужой эпохи не валиден в другом транспорте (сессии свои).
    await a.transport.handleCallback(
      makeCtx({
        callbackQuery: { data: 'menu:open:~3' } as BotContext['callbackQuery'],
      }),
    );
    expect(callsOf(a.uiApp.handleCallback).length).toBe(0);
  });
});

// ── Repo через конструктор (опционально) ──

describe('BotTransport — repo через конструктор (опционально)', () => {
  test('конструктор принимает repo третьим аргументом', () => {
    const repo = makeSessionRepo();
    expect(() => makeTransport({}, repo)).not.toThrow();
  });

  test('конструктор не читает repo: загрузка — явный шаг до старта polling', () => {
    const repo = makeSessionRepo();
    makeTransport({}, repo);

    expect(callsOf(repo.loadAll).length).toBe(0);
    expect(callsOf(repo.loadShortIds).length).toBe(0);
  });

  test('без repo сессии по-прежнему в памяти: /start и callback работают', async () => {
    const bundle = makeTransport();
    const pressed = await startDialog(bundle);

    await bundle.transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(bundle.uiApp.handleCallback).length).toBe(1);
  });
});

// ── Персистентность апдейтов (Фаза 3) ──

describe('BotTransport — персистентность апдейтов', () => {
  test('handleCommand: сессия сохраняется синхронно (await до завершения пути)', async () => {
    let saved = false;
    const repo = makeSessionRepo();
    repo.save = mock(async () => {
      await new Promise((r) => setTimeout(r, 20));
      saved = true;
    });
    const bundle = makeTransport(
      {
        handleCommand: mock(
          async (_u: CommandUpdate, _t: number, s: BotSession) => {
            s.dialog = { path: 'app/menu', seq: 1 };
            return { screen: { text: mdRaw('Меню') } };
          },
        ),
      },
      repo,
    );

    await bundle.transport.handleCommand(makeCommandCtx('/start'));

    // К моменту завершения handle-пути запись уже завершена.
    expect(saved).toBe(true);
    const [tgId, session] = callsOf(repo.save)[0] as [number, BotSession];
    expect(tgId).toBe(123);
    expect(session.dialog?.path).toBe('app/menu');
    expect(session.screen?.messageId).toBe(1);
  });

  test('handleCallback: сессия сохраняется после апдейта', async () => {
    const repo = makeSessionRepo();
    const bundle = makeTransport({}, repo);
    const pressed = await startDialog(bundle);
    callsOf(repo.save).length = 0;

    await bundle.transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(repo.save).length).toBe(1);
  });

  test('handleMessage: ввод сохраняется после апдейта (input.context)', async () => {
    const repo = makeSessionRepo();
    const bundle = makeTransport(
      {
        handleCommand: mock(
          async (_u: CommandUpdate, _t: number, s: BotSession) => {
            s.dialog = { path: 'courses/fill', seq: 3 };
            return { awaitInput: { context: { q: 1 } } };
          },
        ),
        handleMessage: mock(async () => ({
          screen: { text: mdRaw('Принято') },
        })),
      },
      repo,
    );
    await bundle.transport.handleCommand(makeCommandCtx('/start'));
    callsOf(repo.save).length = 0;

    await bundle.transport.handleMessage(
      makeCtx({ message: { text: 'ответ' } as BotContext['message'] }),
    );

    expect(callsOf(repo.save).length).toBe(1);
    const [, session] = callsOf(repo.save)[0] as [number, BotSession];
    expect(session.dialog?.input?.context).toEqual({ q: 1 });
  });

  test('notify: сессию не пишет (И3)', async () => {
    const repo = makeSessionRepo();
    const bundle = makeTransport({}, repo);

    await bundle.transport.notify(123, { text: mdRaw('🔔 Привет') });

    expect(callsOf(repo.save).length).toBe(0);
    expect(callsOf(repo.remove).length).toBe(0);
    expect(callsOf(repo.saveShortId).length).toBe(0);
  });

  test('пустая сессия не сохраняется: callback до /start → remove, не save', async () => {
    const repo = makeSessionRepo();
    const bundle = makeTransport({}, repo);

    await bundle.transport.handleCallback(
      makeCtx({
        callbackQuery: { data: 'menu:open:~1' } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(repo.save).length).toBe(0);
    expect(callsOf(repo.remove).length).toBe(1);
  });

  test('ошибка записи: warn-лог, апдейт не падает, следующий повторяет', async () => {
    const logger = makeLogger();
    setGlobalLogger(logger);
    const repo = makeSessionRepo();
    let calls = 0;
    repo.save = mock(async () => {
      calls++;
      if (calls === 1) throw new Error('disk full');
    });
    const bundle = makeTransport(
      {
        handleCommand: mock(
          async (_u: CommandUpdate, _t: number, s: BotSession) => {
            s.dialog = { path: 'app/menu', seq: 1 };
            return { screen: { text: mdRaw('Меню') } };
          },
        ),
      },
      repo,
    );

    // Первый апдейт: запись падает — но апдейт резолвится.
    await bundle.transport.handleCommand(makeCommandCtx('/start'));
    expect(calls).toBe(1);
    expect(callsOf(logger.warn).length).toBe(1);

    // Второй апдейт: запись повторяется и проходит.
    await bundle.transport.handleCommand(makeCommandCtx('/start'));
    expect(calls).toBe(2);
  });

  test('invite: диалог-якорь сохраняется', async () => {
    const repo = makeSessionRepo();
    const bundle = makeTransport({}, repo);

    await bundle.transport.invite(123, {
      text: mdRaw('Приглашение'),
      keyboard: kb('stream:enroll:x', 'Записаться'),
    });

    expect(callsOf(repo.save).length).toBe(1);
    const [, session] = callsOf(repo.save)[0] as [number, BotSession];
    expect(session.dialog?.seq).toBe(1);
  });

  test('без repo — апдейты работают без записей (in-memory)', async () => {
    const bundle = makeTransport();
    await bundle.transport.handleCommand(makeCommandCtx('/start'));
    await bundle.transport.notify(123, { text: mdRaw('🔔') });

    // Просто не падает — хранилища нет.
    expect(true).toBe(true);
  });
});

// ── Восстановление после рестарта (restore до polling/webhook) ──

describe('BotTransport — restore (загрузка до старта)', () => {
  test('restore: сессия и shortIds восстанавливаются — старая кнопка работает', async () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const restored: BotSession = {
      dialog: { path: 'streams/view', seq: 2 },
    };
    const repo = makeSessionRepo(
      new Map([[123, restored]]),
      new Map([['~a1b2c3d4', uuid]]),
    );
    const bundle = makeTransport({}, repo);
    await bundle.transport.restore();

    // Кнопка из прошлой жизни сервиса: штамп ~2 валиден, shortId разжался.
    await bundle.transport.handleCallback(
      makeCtx({
        callbackQuery: {
          data: `stream:view:~a1b2c3d4:~2`,
        } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(bundle.uiApp.handleCallback)[0]?.[0]).toBe(
      `stream:view:${uuid}`,
    );
  });

  test('restore: без repo — no-op', async () => {
    const bundle = makeTransport();
    await expect(bundle.transport.restore()).resolves.toBeUndefined();
  });

  test('restore: ошибка чтения пробрасывается (fail-fast старта)', async () => {
    const repo = makeSessionRepo();
    repo.loadAll = mock(async () => {
      throw new JsonFileRepoError('битый файл', '/tmp/sessions.json');
    });
    const bundle = makeTransport({}, repo);

    await expect(bundle.transport.restore()).rejects.toThrow(JsonFileRepoError);
  });
});

// ── shortId ↔ repo ──

describe('BotTransport — shortId ↔ repo', () => {
  test('shrink при рендере пишет shortId в repo после апдейта', async () => {
    const repo = makeSessionRepo();
    const bundle = makeTransport({}, repo);

    await startDialog(bundle, {
      code: 'stream:view:a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });

    expect(callsOf(repo.saveShortId).length).toBe(1);
    const [key, value] = callsOf(repo.saveShortId)[0] as [string, string];
    expect(key).toBe('~a1b2c3d4');
    expect(value).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  test('коллизия с суффиксом: оба ключа в repo', async () => {
    const repo = makeSessionRepo();
    const bundle = makeTransport({}, repo);
    const uuid1 = 'a1b2c3d4-1111-0000-0000-000000000001';
    const uuid2 = 'a1b2c3d4-2222-0000-0000-000000000002';

    await startDialog(bundle, { code: `stream:view:${uuid1}` });
    // Второй чат: тот же 8-символьный префикс → суффикс коллизии.
    await startDialog(bundle, { code: `stream:view:${uuid2}` });

    const keys = callsOf(repo.saveShortId).map((c) => c[0]);
    expect(keys).toEqual(['~a1b2c3d4', '~a1b2c3d4-1']);
  });

  test('апдейт без shrink не пишет shortIds', async () => {
    const repo = makeSessionRepo();
    const bundle = makeTransport({}, repo);
    await startDialog(bundle); // код 'menu:open' — UUID нет, сжимать нечего

    expect(callsOf(repo.saveShortId).length).toBe(0);
  });
});
