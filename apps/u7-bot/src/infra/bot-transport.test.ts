import { describe, expect, mock, test } from 'bun:test';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { BotContext } from '../context';
import type { U7BotUiApp } from '../core/ui-app';
import { BotTransport } from './bot-transport';

// ── Фабрики ──

function makeMockBotApi(): Api {
  return {
    sendMessage: mock(async () => ({ message_id: 100 })),
    editMessageText: mock(async () => ({ message_id: 1 })),
  } as unknown as Api;
}

function makeMockUiApp(overrides: Partial<U7BotUiApp> = {}): U7BotUiApp {
  return {
    handleWelcome: mock(async () => ({ sendMessage: { text: 'Привет' } })),
    handleHelp: mock(async () => ({ sendMessage: { text: 'Помощь' } })),
    handleCallback: mock(async () => ({ sendMessage: { text: 'ok' } })),
    handleMessage: mock(async () => ({ sendMessage: { text: 'принято' } })),
    handleCancel: mock(async () => ({
      releaseInput: true,
      sendMessage: { text: 'Отменено' },
    })),
    handleTimeout: mock(async () => ({ releaseInput: true })),
    ...overrides,
  } as unknown as U7BotUiApp;
}

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
  return { activeHandler: null, ...overrides };
}

function makeMockCtx(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: { id: 123, first_name: 'Test', is_bot: false } as BotContext['from'],
    chat: { id: 123, type: 'private' } as BotContext['chat'],
    session: makeSession(),
    reply: mock(async () => ({ message_id: 99 })),
    answerCallbackQuery: mock(async () => true),
    callbackQuery: {
      data: 'stream:view:123',
    } as BotContext['callbackQuery'],
    message: {
      text: 'hello',
    } as BotContext['message'],
    ...overrides,
  } as unknown as BotContext;
}

// ── execute ──

describe('BotTransport — execute', () => {
  test('sendMessage отправляет через botApi.sendMessage', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const session = makeSession();
    const response: BotResponse = {
      sendMessage: { text: 'Тест', parseMode: 'MarkdownV2' },
    };

    // используем send для доступа к приватному execute
    await transport.send(123, response);

    expect(api.sendMessage).toHaveBeenCalled();
    const call = (api.sendMessage as any).mock.calls[0];
    expect(call[0]).toBe(123);
    expect(call[1]).toBe('Тест');
    expect(call[2]?.parse_mode).toBe('MarkdownV2');
  });

  test('sendMessage сохраняет lastBotMessage в сессию', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: { text: 'Привет', parseMode: 'MarkdownV2' },
    });

    const session = sessionMap.get(123);
    expect(session?.lastBotMessage).toBeDefined();
    expect(session!.lastBotMessage!.text).toBe('Привет');
    expect(session!.lastBotMessage!.messageId).toBe(100);
    expect(session!.lastBotMessage!.parseMode).toBe('MarkdownV2');
  });

  test('sendMessage с клавиатурой', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: {
        text: 'Выберите',
        keyboard: {
          rows: [[{ text: 'Кнопка', code: 'btn:action' }]],
          isMultiple: false,
        },
      },
    });

    const call = (api.sendMessage as any).mock.calls[0];
    expect(call[2]?.reply_markup).toBeDefined();
    expect(call[2]?.reply_markup.inline_keyboard[0][0].text).toBe('Кнопка');
    expect(call[2]?.reply_markup.inline_keyboard[0][0].callback_data).toBe(
      'btn:action',
    );
  });

  test('sendMessage с кнопкой-ссылкой (url)', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: {
        text: 'Ссылка',
        keyboard: {
          rows: [[{ text: 'Google', code: '', url: 'https://google.com' }]],
          isMultiple: false,
        },
      },
    });

    const call = (api.sendMessage as any).mock.calls[0];
    expect(call[2]?.reply_markup.inline_keyboard[0][0].url).toBe(
      'https://google.com',
    );
  });

  test('editMessage редактирует через botApi.editMessageText', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      editMessage: {
        messageId: 42,
        text: 'Отредактировано',
      },
    });

    expect(api.editMessageText).toHaveBeenCalled();
    const call = (api.editMessageText as any).mock.calls[0];
    expect(call[0]).toBe(123);
    expect(call[1]).toBe(42);
    expect(call[2]).toBe('Отредактировано');
  });

  test('sendMessages отправляет несколько сообщений', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessages: [{ text: 'Первое' }, { text: 'Второе' }],
      sendDelayMs: 0,
    });

    expect((api.sendMessage as any).mock.calls.length).toBe(2);
    expect((api.sendMessage as any).mock.calls[0][1]).toBe('Первое');
    expect((api.sendMessage as any).mock.calls[1][1]).toBe('Второе');
  });

  test('captureInput устанавливает activeHandler в сессии', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: { text: 'Введите имя' },
      captureInput: { path: 'ask-name', ttlSeconds: 30 },
    });

    const session = sessionMap.get(123);
    expect(session?.activeHandler).not.toBeNull();
    expect(session!.activeHandler!.path).toContain('ask-name');
    expect(session!.activeHandler!.expiresAt).toBeGreaterThan(Date.now());
  });

  test('releaseInput очищает activeHandler', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();

    // Предустановленный activeHandler
    sessionMap.set(123, {
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      releaseInput: true,
    });

    const session = sessionMap.get(123);
    expect(session?.activeHandler).toBeNull();
  });

  test('captureInput сохраняет context', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: { text: '?' },
      captureInput: {
        path: 'fill',
        context: { questionnaireId: 'q1' },
      },
    });

    const session = sessionMap.get(123);
    expect(session?.activeHandler?.context).toEqual({
      questionnaireId: 'q1',
    });
  });

  test('удаление клавиатуры у предыдущего сообщения', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();

    // Устанавливаем lastBotMessage с клавиатурой
    sessionMap.set(123, {
      activeHandler: null,
      lastBotMessage: {
        text: 'Предыдущее',
        messageId: 42,
        keyboard: {
          rows: [[{ text: 'Кнопка', code: 'btn' }]],
          isMultiple: false,
        },
      },
    });

    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: { text: 'Новое' },
    });

    // editMessageText должен быть вызван для удаления клавиатуры
    expect(api.editMessageText).toHaveBeenCalled();
    const call = (api.editMessageText as any).mock.calls[0];
    expect(call[0]).toBe(123);
    expect(call[1]).toBe(42);
    expect(call[3]?.reply_markup).toBeUndefined();
  });

  test('keepPrevKeyboard: true — НЕ удаляет клавиатуру', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();

    sessionMap.set(123, {
      activeHandler: null,
      lastBotMessage: {
        text: 'Предыдущее',
        messageId: 42,
        keyboard: {
          rows: [[{ text: 'Кнопка', code: 'btn' }]],
          isMultiple: false,
        },
      },
    });

    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: { text: 'Новое' },
      keepPrevKeyboard: true,
    });

    // editMessageText не должен вызываться для удаления
    // (но мог вызываться для чего-то другого)
    const editCalls = (api.editMessageText as any).mock.calls;
    const removalCall = editCalls.find(
      (c: any[]) => c[3]?.reply_markup === undefined,
    );
    expect(removalCall).toBeUndefined();
  });

  test('без lastBotMessage — удаление не вызывается', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: { text: 'Новое' },
    });

    // editMessageText не должен вызываться
    expect(api.editMessageText).not.toHaveBeenCalled();
  });
});

// ── Сжатие UUID ──

describe('BotTransport — сжатие UUID', () => {
  test('compressResponse сжимает UUID в callback_data кнопок', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    await transport.send(123, {
      sendMessage: {
        text: 'Выберите',
        keyboard: {
          rows: [[{ text: 'Поток 1', code: `stream:view:${uuid}` }]],
          isMultiple: false,
        },
      },
    });

    const call = (api.sendMessage as any).mock.calls[0];
    const cbData = call[2]?.reply_markup.inline_keyboard[0][0].callback_data;
    // UUID должен быть сжат до первых 8 символов с маркером shortId
    expect(cbData).toBe('stream:view:~a1b2c3d4');
    expect(cbData).not.toContain(uuid);
  });

  test('префикс app: не сжимается', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(123, {
      sendMessage: {
        text: 'Меню',
        keyboard: {
          rows: [[{ text: 'Главная', code: 'app:main-menu' }]],
          isMultiple: false,
        },
      },
    });

    const call = (api.sendMessage as any).mock.calls[0];
    const cbData = call[2]?.reply_markup.inline_keyboard[0][0].callback_data;
    expect(cbData).toBe('app:main-menu');
  });

  test('разжимает сжатый UUID при обратном callback (round-trip)', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    await transport.send(123, {
      sendMessage: {
        text: 'Выберите',
        keyboard: {
          rows: [[{ text: 'Поток 1', code: `stream:view:${uuid}` }]],
          isMultiple: false,
        },
      },
    });

    const sentCall = (api.sendMessage as any).mock.calls[0];
    const compressedData =
      sentCall[2]?.reply_markup.inline_keyboard[0][0].callback_data;
    expect(compressedData).toBe('stream:view:~a1b2c3d4');
    expect(compressedData).not.toContain(uuid);

    uiApp.handleCallback = mock(async (data: string) => ({
      sendMessage: { text: `view:${data}` },
    }));

    const ctx = makeMockCtx({
      callbackQuery: {
        data: compressedData,
      } as BotContext['callbackQuery'],
    });

    await transport.handleCallback(ctx);

    const cbCall = (uiApp.handleCallback as any).mock.calls[0];
    expect(cbCall[0]).toBe(`stream:view:${uuid}`);
  });

  test('коллизия: одинаковые первые 8 символов получают суффикс и разжимаются оба', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    // Оба UUID начинаются с a1b2c3d4 — коллизия базового ключа
    const uuid1 = 'a1b2c3d4-1111-2222-3333-444444444444';
    const uuid2 = 'a1b2c3d4-aaaa-bbbb-cccc-dddddddddddd';

    await transport.send(123, {
      sendMessage: {
        text: 'Выберите',
        keyboard: {
          rows: [
            [{ text: 'Поток 1', code: `stream:view:${uuid1}` }],
            [{ text: 'Поток 2', code: `stream:view:${uuid2}` }],
          ],
          isMultiple: false,
        },
      },
    });

    const sentCall = (api.sendMessage as any).mock.calls[0];
    const kb = sentCall[2]?.reply_markup.inline_keyboard;
    const first = kb[0][0].callback_data;
    const second = kb[1][0].callback_data;

    // Первый — без суффикса, второй — с суффиксом коллизии
    expect(first).toBe('stream:view:~a1b2c3d4');
    expect(second).toBe('stream:view:~a1b2c3d4-1');

    // Оба разжимаются в свои полные UUID
    uiApp.handleCallback = mock(async (data: string) => ({
      sendMessage: { text: `view:${data}` },
    }));

    for (const [cbData, expected] of [
      [first, uuid1],
      [second, uuid2],
    ] as const) {
      const ctx = makeMockCtx({
        callbackQuery: { data: cbData } as BotContext['callbackQuery'],
      });
      await transport.handleCallback(ctx);

      const call = (uiApp.handleCallback as any).mock.calls.at(-1);
      expect(call[0]).toBe(`stream:view:${expected}`);
    }
  });

  test('несколько UUID в одной кнопке сжимаются и разжимаются все', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const uuidA = '11111111-2222-3333-4444-555555555555';
    const uuidB = 'abcdef12-3456-7890-abcd-ef1234567890';

    await transport.send(123, {
      sendMessage: {
        text: 'Выберите',
        keyboard: {
          rows: [
            [
              {
                text: 'Связать',
                code: `stream:pair:${uuidA}:${uuidB}`,
              },
            ],
          ],
          isMultiple: false,
        },
      },
    });

    const sentCall = (api.sendMessage as any).mock.calls[0];
    const cbData =
      sentCall[2]?.reply_markup.inline_keyboard[0][0].callback_data;
    // Каждый UUID сжат со своим маркером
    expect(cbData).toBe('stream:pair:~11111111:~abcdef12');
    expect(cbData).not.toContain(uuidA);
    expect(cbData).not.toContain(uuidB);

    // Оба UUID разжимаются обратно
    uiApp.handleCallback = mock(async (data: string) => ({
      sendMessage: { text: `pair:${data}` },
    }));

    const ctx = makeMockCtx({
      callbackQuery: { data: cbData } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(ctx);

    const call = (uiApp.handleCallback as any).mock.calls[0];
    expect(call[0]).toBe(`stream:pair:${uuidA}:${uuidB}`);
  });

  test('hex8 без маркера — не сжимается и не считается shortId', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx({
      callbackQuery: {
        data: 'stream:view:a1b2c3d4',
      } as BotContext['callbackQuery'],
    });

    await transport.handleCallback(ctx);

    // Без маркера — уходит в UiApp как есть (не stale, не сжат)
    const call = (uiApp.handleCallback as any).mock.calls[0];
    expect(call[0]).toBe('stream:view:a1b2c3d4');
  });
});

// ── handleCallback ──

describe('BotTransport — handleCallback', () => {
  test('маршрутизирует callback в uiApp.handleCallback', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx({
      callbackQuery: {
        data: 'stream:view:s1',
      } as BotContext['callbackQuery'],
    });

    await transport.handleCallback(ctx);

    expect(uiApp.handleCallback).toHaveBeenCalled();
    const call = (uiApp.handleCallback as any).mock.calls[0];
    expect(call[0]).toBe('stream:view:s1');
    expect(call[1]).toBe(123); // tgId
  });

  test('устаревшая кнопка (shortId не найден) — alert и НЕ вызов UiApp', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx({
      callbackQuery: {
        // Сжатый id без записи в shortIds (кнопка из прошлой жизни сервиса)
        data: 'stream:view:~a1b2c3d4',
      } as BotContext['callbackQuery'],
    });

    await transport.handleCallback(ctx);

    // UiApp не вызывается
    expect(uiApp.handleCallback).not.toHaveBeenCalled();

    // Вместо этого — alert с текстом про устаревшую кнопку
    const cb = (ctx.answerCallbackQuery as any).mock.calls[0];
    expect(cb?.[0]?.show_alert).toBe(true);
    expect(cb?.[0]?.text).toContain('кнопка устарела');
    expect(cb?.[0]?.text).toContain('/start');
  });

  test('устаревшая кнопка с несколькими shortId — alert, если любой не найден', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    // Сжимаем один uuid, чтобы он был в мапе, а второй — нет
    const known = '11111111-2222-3333-4444-555555555555';
    await transport.send(123, {
      sendMessage: {
        text: 'Выберите',
        keyboard: {
          rows: [
            [{ text: 'Связать', code: `stream:pair:${known}:unknown-id` }],
          ],
          isMultiple: false,
        },
      },
    });

    const sentCall = (api.sendMessage as any).mock.calls[0];
    const cbData =
      sentCall[2]?.reply_markup.inline_keyboard[0][0].callback_data;

    // Подменяем известный shortId на неизвестный (как после перезапуска)
    const staleData = cbData.replace('~11111111', '~deadbeef');

    const ctx = makeMockCtx({
      callbackQuery: {
        data: staleData,
      } as BotContext['callbackQuery'],
    });

    await transport.handleCallback(ctx);

    expect(uiApp.handleCallback).not.toHaveBeenCalled();
    const cb = (ctx.answerCallbackQuery as any).mock.calls[0];
    expect(cb?.[0]?.text).toContain('кнопка устарела');
  });

  test('показывает alert при чужом callback', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp({
      handleCallback: mock(async () => ({
        sendMessage: {
          text: '⚠️ Сначала завершите текущее действие (/cancel)',
        },
      })),
    });
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx({
      callbackQuery: {
        data: 'stream:view:s1',
      } as BotContext['callbackQuery'],
    });

    await transport.handleCallback(ctx);

    expect(ctx.answerCallbackQuery).toHaveBeenCalled();
    const call = (ctx.answerCallbackQuery as any).mock.calls[0];
    expect(call[0]?.show_alert).toBe(true);
    expect(call[0]?.text).toContain('завершите текущее действие');
  });

  test('ack после обработки callback', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx({
      callbackQuery: {
        data: 'stream:view:s1',
      } as BotContext['callbackQuery'],
    });

    await transport.handleCallback(ctx);

    // answerCallbackQuery должен быть вызван (ack)
    expect(ctx.answerCallbackQuery).toHaveBeenCalled();
  });
});

// ── handleMessage ──

describe('BotTransport — handleMessage', () => {
  test('форвардит сообщение в uiApp.handleMessage', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();

    // Устанавливаем activeHandler
    sessionMap.set(123, {
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx({
      message: { text: 'Иван' } as BotContext['message'],
      session: sessionMap.get(123)!,
    });

    await transport.handleMessage(ctx, async () => {});

    expect(uiApp.handleMessage).toHaveBeenCalled();
    const call = (uiApp.handleMessage as any).mock.calls[0];
    expect(call[0]?.text).toBe('Иван');
    expect(call[0]?.telegramId).toBe(123);
  });

  test('без activeHandler — передаёт управление next', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp({
      handleMessage: mock(async () => null),
    });
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    let nextCalled = false;
    const ctx = makeMockCtx();

    await transport.handleMessage(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(uiApp.handleMessage).not.toHaveBeenCalled();
  });

  test('команды пропускаются (начинаются с /)', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    let nextCalled = false;
    const ctx = makeMockCtx({
      message: { text: '/start' } as BotContext['message'],
    });

    await transport.handleMessage(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(uiApp.handleMessage).not.toHaveBeenCalled();
  });
});

// ── send (proactive) ──

describe('BotTransport — send (proactive)', () => {
  test('отправляет сообщение пользователю без контекста', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(456, {
      sendMessage: { text: 'Упредительное сообщение' },
    });

    expect(api.sendMessage).toHaveBeenCalled();
    const call = (api.sendMessage as any).mock.calls[0];
    expect(call[0]).toBe(456);
    expect(call[1]).toBe('Упредительное сообщение');
  });

  test('создаёт сессию если её нет', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(456, {
      captureInput: { path: 'fill', context: { questionnaireId: 'q1' } },
    });

    const session = sessionMap.get(456);
    expect(session).toBeDefined();
    expect(session!.activeHandler).not.toBeNull();
  });

  test('использует существующую сессию', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    sessionMap.set(456, {
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.send(456, {
      releaseInput: true,
    });

    const session = sessionMap.get(456);
    expect(session?.activeHandler).toBeNull();
  });

  test('сжимает UUID в proactive send', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const uuid = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

    await transport.send(456, {
      sendMessage: {
        text: 'Приглашение',
        keyboard: {
          rows: [
            [{ text: 'Начать', code: `questionnaire:fill:start:${uuid}` }],
          ],
          isMultiple: false,
        },
      },
    });

    const call = (api.sendMessage as any).mock.calls[0];
    expect(call[2]?.reply_markup.inline_keyboard[0][0].callback_data).toBe(
      'questionnaire:fill:start:~b2c3d4e5',
    );
  });
});

// ── notify (proactive) ──

describe('BotTransport — notify (proactive)', () => {
  test('отправляет уведомление и НЕ удаляет клавиатуру предыдущего экрана', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();

    // Пользователь смотрит каталог — его клавиатура не должна пострадать
    sessionMap.set(123, {
      activeHandler: null,
      lastBotMessage: {
        text: 'Каталог',
        messageId: 42,
        keyboard: {
          rows: [[{ text: 'Курс 1', code: 'btn' }]],
          isMultiple: false,
        },
      },
    });

    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.notify(123, { text: '🎓 Ты зачислен' });

    // Сообщение отправлено — с заголовком уведомления
    expect(api.sendMessage).toHaveBeenCalled();
    const call = (api.sendMessage as any).mock.calls[0];
    expect(call[0]).toBe(123);
    expect(call[1]).toBe('🔔 Уведомление:\n\n🎓 Ты зачислен');

    // Клавиатура предыдущего сообщения сохранена — removal не вызывался
    const editCalls = (api.editMessageText as any).mock.calls;
    const removalCall = editCalls.find(
      (c: any[]) => c[3]?.reply_markup === undefined,
    );
    expect(removalCall).toBeUndefined();

    // Уведомление НЕ стало последним сообщением — сессия помнит каталог
    const last = sessionMap.get(123)?.lastBotMessage;
    expect(last?.messageId).toBe(42);
    expect(last?.keyboard).toBeDefined();
  });

  test('не трогает session.activeHandler при активном вводе', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();

    const activeHandler = {
      path: 'questionnaire/fill',
      context: { questionnaireId: 'q1' },
    };
    sessionMap.set(123, { activeHandler });

    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.notify(123, { text: 'Уведомление' });

    expect(sessionMap.get(123)?.activeHandler).toBe(activeHandler);
  });

  test('создаёт сессию, если её нет', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.notify(456, { text: 'Привет' });

    const session = sessionMap.get(456);
    expect(session).toBeDefined();
    expect(session?.activeHandler).toBeNull();
    // Уведомление не занимает слот последнего сообщения
    expect(session?.lastBotMessage).toBeUndefined();
  });

  test('MarkdownV2: заголовок жирным + parseMode прокидывается', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    await transport.notify(123, {
      text: '🎉 Курс завершён\\!',
      parseMode: 'MarkdownV2',
    });

    const call = (api.sendMessage as any).mock.calls[0];
    expect(call[1]).toBe('🔔 *Уведомление:*\n\n🎉 Курс завершён\\!');
    expect(call[2]?.parse_mode).toBe('MarkdownV2');
  });
});

// ── handleStart / handleCancel / handleHelp ──

describe('BotTransport — handleStart, handleCancel, handleHelp', () => {
  test('handleStart вызывает uiApp.handleWelcome и сбрасывает activeHandler', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx();
    ctx.session.activeHandler = { path: 'some/path' };

    await transport.handleStart(ctx);

    expect(ctx.session.activeHandler).toBeNull();
    expect(uiApp.handleWelcome).toHaveBeenCalledWith(123);
    expect(api.sendMessage).toHaveBeenCalled();
  });

  test('handleHelp вызывает uiApp.handleHelp', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx();

    await transport.handleHelp(ctx);

    expect(uiApp.handleHelp).toHaveBeenCalledWith(123);
    expect(api.sendMessage).toHaveBeenCalled();
  });

  test('handleCancel вызывает uiApp.handleCancel', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp();
    const sessionMap = new Map<number, SessionData>();

    sessionMap.set(123, {
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const transport = new BotTransport(uiApp, api, sessionMap);
    const ctx = makeMockCtx();
    ctx.session = sessionMap.get(123)!;

    await transport.handleCancel(ctx);

    expect(uiApp.handleCancel).toHaveBeenCalledWith(123, ctx.session);
  });

  test('handleCancel без activeHandler — reply', async () => {
    const api = makeMockBotApi();
    const uiApp = makeMockUiApp({
      handleCancel: mock(async () => null),
    });
    const sessionMap = new Map<number, SessionData>();
    const transport = new BotTransport(uiApp, api, sessionMap);

    const ctx = makeMockCtx();

    await transport.handleCancel(ctx);

    expect(ctx.reply).toHaveBeenCalledWith('Нечего отменять. Нажмите /start');
  });
});
