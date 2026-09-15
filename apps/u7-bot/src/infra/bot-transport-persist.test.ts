import { describe, expect, mock, test } from 'bun:test';
import { mdRaw } from '@u7-scl/core/shared';
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

function makeSessionRepo(): BotSessionRepo {
  return {
    loadAll: mock(async () => new Map<number, BotSession>()),
    save: mock(async () => {}),
    remove: mock(async () => {}),
    loadShortIds: mock(async () => new Map<string, string>()),
    saveShortId: mock(async () => {}),
  };
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
