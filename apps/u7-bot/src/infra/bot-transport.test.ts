import { describe, expect, mock, test } from 'bun:test';
import { type Logger, mdRaw, setGlobalLogger } from '@u7-scl/core/shared';
import {
  BotController,
  type BotSession,
  BotUiApp,
  type CommandUpdate,
  type DialogResponse,
  type Screen,
} from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { BotContext } from '../context';
import type { DialogUiAppPort } from './bot-transport';
import { BotTransport, parseCommandText } from './bot-transport';

/**
 * Тесты транспорта на контракте «Диалог и Экран»
 * (трек bot-ui-dialog-core, Фаза 2): штампы, per-chat очередь,
 * рендер-политика §5, тон-каналы, warn-логи ошибок Telegram API.
 *
 * Транспорт чёрным ящиком: сессия наблюдается через объект, который
 * транспорт передаёт в uiApp; штампованные коды читаются из аргументов
 * моков Grammy Api. Первый экран всегда открывается через /start
 * (handleCommand 'start' выставляет диалог — как конвейер uiApp Фазы 2).
 */

// ── Фабрики ──

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
function makeCommandCtx(text: string): BotContext {
  return makeCtx({ message: { text } as BotContext['message'] });
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

/** Клавиатура одной кнопки. */
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

/**
 * Сборка: транспорт + мок uiApp, открывающий начальный экран через /start.
 * Возвращает код нажимаемой кнопки (со штампом) и captured-сессию
 * (мок выставляет диалог — тип сужен для удобства ассертов).
 */
async function startDialog(
  opts: {
    seq: number;
    code?: string;
    text?: string;
    path?: string;
    uiApp?: Partial<DialogUiAppPort>;
  } = { seq: 5 },
): Promise<{
  api: Api;
  uiApp: DialogUiAppPort;
  transport: BotTransport;
  pressed: string;
  session: BotSession & { dialog: NonNullable<BotSession['dialog']> };
}> {
  const api = makeMockBotApi();
  let captured: BotSession | undefined;
  const code = opts.code ?? 'menu:open';
  const { handleCommand, ...rest } = opts.uiApp ?? {};
  const uiApp = makeUiApp({
    handleCommand: mock(
      async (update: CommandUpdate, tg: number, s: BotSession) => {
        captured = s;
        if (handleCommand) return handleCommand(update, tg, s);
        s.dialog = { path: opts.path ?? 'app/menu', seq: opts.seq };
        return {
          screen: {
            text: mdRaw(opts.text ?? 'Меню'),
            keyboard: kb(code, '📂 Меню'),
          },
        };
      },
    ),
    ...rest,
  });
  const transport = new BotTransport(uiApp, api);
  await transport.handleCommand(makeCommandCtx('/start'));
  const pressed = lastSentCallbackData(api);
  if (!pressed) throw new Error('welcome-экран не отправлен');
  if (!captured?.dialog) {
    throw new Error('сессия/диалог не передан в uiApp');
  }
  return {
    api,
    uiApp,
    transport,
    pressed,
    session: captured as BotSession & {
      dialog: NonNullable<BotSession['dialog']>;
    },
  };
}

// ── Штампы ──

describe('BotTransport — штампы :~<seq36>', () => {
  test('отправка: в код callback-кнопки дописывается :~<seq36>', async () => {
    const { api, pressed } = await startDialog({ seq: 5 });

    expect(pressed).toBe('menu:open:~5');
  });

  test('большой seq кодируется base36', async () => {
    const { pressed } = await startDialog({ seq: 1234 });

    expect(pressed).toBe(`menu:open:~${(1234).toString(36)}`);
  });

  test('url-кнопки — без штампа', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        s.dialog = { path: 'app/menu', seq: 1 };
        return {
          screen: {
            text: mdRaw('Ссылка'),
            keyboard: {
              rows: [[{ text: 'Google', code: '', url: 'https://google.com' }]],
              isMultiple: false,
            },
          },
        };
      }),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(makeCommandCtx('/start'));

    const sent = callsOf(api.sendMessage)[0];
    const row = (
      sent?.[2] as {
        reply_markup?: {
          inline_keyboard?: { url?: string; callback_data?: string }[][];
        };
      }
    )?.reply_markup?.inline_keyboard?.[0]?.[0];
    expect(row?.url).toBe('https://google.com');
    expect(row?.callback_data).toBeUndefined();
  });

  test('приём: валидный штамп срезается, uiApp получает чистый код', async () => {
    const { transport, uiApp, pressed } = await startDialog({ seq: 5 });

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(uiApp.handleCallback)[0]?.[0]).toBe('menu:open');
  });

  test('приём: несовпавший штамп → alert «нажмите /start», uiApp не вызывается', async () => {
    const { transport, uiApp } = await startDialog({ seq: 5 });

    const ctx = makeCtx({
      callbackQuery: { data: 'menu:open:~9' } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(ctx);

    expect(callsOf(uiApp.handleCallback).length).toBe(0);
    const ack = callsOf(ctx.answerCallbackQuery)[0] ?? [];
    expect(ack[0]).toMatchObject({ show_alert: true });
    expect((ack[0] as { text: string }).text).toContain('/start');
  });

  test('приём: кнопка без штампа (легаси до деплоя) → alert', async () => {
    const { transport, uiApp } = await startDialog({ seq: 5 });

    const ctx = makeCtx({
      callbackQuery: { data: 'menu:open' } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(ctx);

    expect(callsOf(uiApp.handleCallback).length).toBe(0);
    const ack = callsOf(ctx.answerCallbackQuery)[0] ?? [];
    expect((ack[0] as { text: string }).text).toContain('/start');
  });

  test('коллизия с ~: сегмент данных на ~ не съедается парсером штампа', async () => {
    const { transport, uiApp, pressed } = await startDialog({
      seq: 7,
      code: 'fill:answer:~weird',
    });

    expect(pressed).toBe('fill:answer:~weird:~7');

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(uiApp.handleCallback)[0]?.[0]).toBe('fill:answer:~weird');
  });

  test('коллизия с ~: shortId-сегмент + штамп round-trip', async () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const { transport, uiApp, pressed } = await startDialog({
      seq: 2,
      code: `stream:view:${uuid}`,
    });

    expect(pressed).toBe('stream:view:~a1b2c3d4:~2');

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(uiApp.handleCallback)[0]?.[0]).toBe(`stream:view:${uuid}`);
  });

  test('штамп ~0 при закрытом диалоге (легаси-кнопка до /start) → alert «Наберите /start»', async () => {
    // Свежий чат без /start: диалог не открыт — любая кнопка ведёт к /start.
    // Штампы валидны только от 1 (seq = 0 в живой сессии больше невозможен).
    const api = makeMockBotApi();
    const uiApp = makeUiApp();
    const transport = new BotTransport(uiApp, api);

    const ctx = makeCtx({
      callbackQuery: { data: 'menu:open:~0' } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(ctx);

    expect(callsOf(uiApp.handleCallback).length).toBe(0);
    const ack = callsOf(ctx.answerCallbackQuery)[0] ?? [];
    expect(ack[0]).toMatchObject({ show_alert: true });
    expect((ack[0] as { text: string }).text).toBe('Наберите /start');
  });

  test('shortId не найден (рестарт) → alert про перезапуск, uiApp не вызывается', async () => {
    const { transport, uiApp } = await startDialog({ seq: 1 });

    // Штамп ~1 валиден, но shortId ~deadbeef неизвестен (рестарт сервиса)
    const ctx = makeCtx({
      callbackQuery: {
        data: 'stream:view:~deadbeef:~1',
      } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(ctx);

    expect(callsOf(uiApp.handleCallback).length).toBe(0);
    const ack = callsOf(ctx.answerCallbackQuery)[0] ?? [];
    expect((ack[0] as { text: string }).text).toContain('перезапуска');
  });
});

// ── Per-chat очередь ──

describe('BotTransport — per-chat очередь', () => {
  test('параллельные handleCallback сериализуются (webhook-сценарий)', async () => {
    const order: string[] = [];
    const api = makeMockBotApi({
      sendMessage: mock(async () => {
        order.push('send:start');
        await new Promise((r) => setTimeout(r, 5));
        order.push('send:end');
        return { message_id: ++messageIdSeq };
      }),
    });
    let session: BotSession | undefined;
    let step = 0;
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        session = s;
        s.dialog = { path: 'app/menu', seq: 5 };
        return { screen: { text: mdRaw('Меню'), keyboard: kb('menu:open') } };
      }),
      handleCallback: mock(async () => {
        step += 1;
        // info-ответ: не меняет seq/экран — обе параллельные кнопки валидны
        return { info: { text: mdRaw(`Реплика ${step}`) } };
      }),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(makeCommandCtx('/start'));
    const pressed = lastSentCallbackData(api)!;
    order.length = 0; // дальше — только параллельная пара

    await Promise.all([
      transport.handleCallback(
        makeCtx({
          callbackQuery: { data: pressed } as BotContext['callbackQuery'],
        }),
      ),
      transport.handleCallback(
        makeCtx({
          callbackQuery: { data: pressed } as BotContext['callbackQuery'],
        }),
      ),
    ]);

    expect(order).toEqual(['send:start', 'send:end', 'send:start', 'send:end']);
    expect(session).toBeDefined();
  });

  test('notify сериализуется с handle*-апдейтами', async () => {
    const order: string[] = [];
    const api = makeMockBotApi({
      sendMessage: mock(async (_id: number, text: string) => {
        order.push(`send:${text}`);
        await new Promise((r) => setTimeout(r, 5));
        return { message_id: ++messageIdSeq };
      }),
    });
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        s.dialog = { path: 'app/menu', seq: 5 };
        return { screen: { text: mdRaw('Меню'), keyboard: kb('menu:open') } };
      }),
      handleCallback: mock(async (_d, _t, s: BotSession) => {
        s.dialog = { path: 'x/y', seq: 6 }; // send-путь
        return { screen: { text: mdRaw('Экран') } };
      }),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(makeCommandCtx('/start'));
    order.length = 0;

    await Promise.all([
      transport.handleCallback(
        makeCtx({
          callbackQuery: {
            data: 'app:menu:open:~5',
          } as BotContext['callbackQuery'],
        }),
      ),
      transport.notify(123, { text: mdRaw('Уведомление') }),
    ]);

    expect(order).toEqual([
      'send:Экран',
      'send:🔔 *Уведомление:*\n\nУведомление',
    ]);
  });

  test('ошибка первой работы не роняет хвост очереди', async () => {
    const api = makeMockBotApi();
    let n = 0;
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        s.dialog = { path: 'app/menu', seq: 5 };
        return { screen: { text: mdRaw('Меню') } };
      }),
      handleCallback: mock(async (_d, _t, s: BotSession) => {
        n += 1;
        if (n === 1) throw new Error('uiApp упал');
        s.dialog = { path: 'x/y', seq: 6 }; // send-путь
        return { screen: { text: mdRaw('Дошло') } };
      }),
    });
    const transport = new BotTransport(uiApp, api);
    await transport.handleCommand(makeCommandCtx('/start'));

    const first = transport.handleCallback(
      makeCtx({
        callbackQuery: {
          data: 'app:menu:open:~5',
        } as BotContext['callbackQuery'],
      }),
    );
    const second = transport.handleCallback(
      makeCtx({
        callbackQuery: {
          data: 'app:menu:open:~5',
        } as BotContext['callbackQuery'],
      }),
    );

    await expect(first).rejects.toThrow('uiApp упал');
    await expect(second).resolves.toBeUndefined();
    const sends = callsOf(api.sendMessage).map((c) => c[1]);
    expect(sends).toContain('Дошло');
  });

  test('polling: последовательные вызовы сохраняют порядок (очередь no-op)', async () => {
    let step = 0;
    const api = makeMockBotApi();
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        s.dialog = { path: 'app/menu', seq: 1 };
        return { screen: { text: mdRaw('Меню') } };
      }),
      handleCallback: mock(async () => {
        step += 1;
        // info-ответ: не меняет seq — обе последовательные кнопки валидны
        return { info: { text: mdRaw(`Шаг ${step}`) } };
      }),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(makeCommandCtx('/start'));
    await transport.handleCallback(
      makeCtx({
        callbackQuery: {
          data: 'app:menu:open:~1',
        } as BotContext['callbackQuery'],
      }),
    );
    await transport.handleCallback(
      makeCtx({
        callbackQuery: {
          data: 'app:menu:open:~1',
        } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(api.sendMessage).map((c) => c[1])).toEqual([
      'Меню',
      'Шаг 1',
      'Шаг 2',
    ]);
  });
});

// ── Рендер-политика §5 ──

describe('BotTransport — рендер-политика', () => {
  test('screen чужого диалога: retire с маркером выбора + send нового', async () => {
    const { api, transport, pressed } = await startDialog({
      seq: 5,
      code: 'menu:open',
      text: 'Меню',
      uiApp: {
        handleCallback: mock(async (_d, _t, s: BotSession) => {
          s.dialog = { path: 'streams/catalog', seq: 6 };
          return { screen: { text: mdRaw('Каталог') } };
        }),
      },
    });

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    // retire: edit первого сообщения — текст + маркер выбора, клавиатура снята
    const edits = callsOf(api.editMessageText);
    expect(edits[0]?.[1]).toBe(1); // messageId экрана меню
    expect(edits[0]?.[2]).toContain('Вы выбрали: 📂 Меню');
    expect(edits[0]?.[3]).toMatchObject({ reply_markup: undefined });
    // send нового экрана
    expect(
      callsOf(api.sendMessage)
        .map((c) => c[1])
        .at(-1),
    ).toBe('Каталог');
  });

  test('код нажатой кнопки не найден в ретируемой клавиатуре — retire без маркера', async () => {
    const { api, transport } = await startDialog({
      seq: 5,
      text: 'Меню',
      uiApp: {
        handleCallback: mock(async (_d, _t, s: BotSession) => {
          s.dialog = { path: 'x/y', seq: 6 };
          return { screen: { text: mdRaw('Новый') } };
        }),
      },
    });

    // Штамп ~5 валиден, но код 'menu:zzz' отсутствует в клавиатуре экрана
    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: 'menu:zzz:~5' } as BotContext['callbackQuery'],
      }),
    );

    const edits = callsOf(api.editMessageText);
    expect(edits[0]?.[2]).toBe('Меню'); // без маркера
  });

  test('/start: retire без маркера + send welcome', async () => {
    const api = makeMockBotApi();
    let n = 0;
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        n += 1;
        s.dialog = { path: 'app/menu', seq: 4 + n };
        return {
          screen: {
            text: mdRaw(n === 1 ? 'Меню' : 'Добро пожаловать'),
            keyboard: n === 1 ? kb('menu:open', '📂 Меню') : undefined,
          },
        };
      }),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(makeCommandCtx('/start')); // экран с клавиатурой, seq 5
    await transport.handleCommand(makeCommandCtx('/start')); // seq 6 → retire без маркера + send

    const edits = callsOf(api.editMessageText);
    expect(edits[0]?.[2]).toBe('Меню'); // ровно текст, без «Вы выбрали»
    expect(edits[0]?.[3]).toMatchObject({ reply_markup: undefined });
    const sends = callsOf(api.sendMessage).map((c) => c[1]);
    expect(sends.at(-1)).toBe('Добро пожаловать');
  });

  test('screen своего диалога: edit на месте со штампом текущего seq', async () => {
    const { api, transport, pressed } = await startDialog({
      seq: 5,
      uiApp: {
        handleCallback: mock(async () => ({
          screen: { text: mdRaw('Меню 2'), keyboard: kb('menu:list') },
        })),
      },
    });
    const sendsAfterWelcome = callsOf(api.sendMessage).length;

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    const edits = callsOf(api.editMessageText);
    expect(edits[0]?.[1]).toBe(1); // тот же messageId
    expect(edits[0]?.[2]).toBe('Меню 2');
    const editKb = (
      edits[0]?.[3] as {
        reply_markup?: { inline_keyboard: { callback_data: string }[][] };
      }
    )?.reply_markup?.inline_keyboard[0]?.[0]?.callback_data;
    expect(editKb).toBe('menu:list:~5');
    expect(callsOf(api.sendMessage).length).toBe(sendsAfterWelcome); // send не было
  });

  test('finalize своего экрана: edit без клавиатуры, затем send нового экрана', async () => {
    const { api, transport, pressed } = await startDialog({
      seq: 5,
      path: 'questionnaire/fill',
      code: 'fill:answer:1',
      text: 'Вопрос 1',
      uiApp: {
        handleCallback: mock(async () => ({
          finalize: { text: mdRaw('✅ Вы выбрали: Вариант 1') },
          screen: { text: mdRaw('Вопрос 2'), keyboard: kb('fill:answer:2') },
        })),
      },
    });

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    const edits = callsOf(api.editMessageText);
    expect(edits[0]?.[1]).toBe(1);
    expect(edits[0]?.[2]).toBe('✅ Вы выбрали: Вариант 1'); // без транспортного маркера
    expect(edits[0]?.[3]).toMatchObject({ reply_markup: undefined });
    const sends = callsOf(api.sendMessage).map((c) => c[1]);
    expect(sends.at(-1)).toBe('Вопрос 2');
  });

  test('finalize один (без screen): экран финализирован, release снимает input', async () => {
    const { transport, pressed, session } = await startDialog({
      seq: 5,
      path: 'questionnaire/fill',
      uiApp: {
        handleCallback: mock(async () => ({
          finalize: { text: mdRaw('✅ Готово') },
          release: true,
        })),
      },
    });

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(session.screen?.keyboard).toBeUndefined();
    expect(session.screen?.text).toBe('✅ Готово');
    expect(session.dialog.input).toBeUndefined();
  });

  test('finalize чужого экрана: warn-лог и пропуск, ничего не редактируется', async () => {
    const logger = makeLogger();
    setGlobalLogger(logger);
    const { api, transport, pressed } = await startDialog({
      seq: 5,
      uiApp: {
        handleCallback: mock(async (_d, _t, s: BotSession) => {
          s.dialog = { path: 'x/y', seq: 9 };
          return { finalize: { text: mdRaw('Фиксация') } };
        }),
      },
    });

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(api.editMessageText).length).toBe(0);
    expect(logger.warn).toHaveBeenCalled();
  });

  test('info: send без клавиатуры, экран и диалог не тронуты', async () => {
    const { api, transport, pressed, session } = await startDialog({
      seq: 5,
      uiApp: {
        handleCallback: mock(async () => ({
          info: { text: mdRaw('ⓘ Подсказка') },
        })),
      },
    });
    const screenBefore = session.screen;

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    const sends = callsOf(api.sendMessage);
    expect(sends.at(-1)?.[1]).toBe('ⓘ Подсказка');
    expect(
      (sends.at(-1)?.[2] as { reply_markup?: unknown }).reply_markup,
    ).toBeUndefined();
    expect(callsOf(api.editMessageText).length).toBe(0);
    expect(session.screen).toBe(screenBefore);
  });

  test('awaitInput ставит dialog.input', async () => {
    const { transport, session } = await startDialog({
      seq: 5,
      path: 'q/fill',
      uiApp: {
        handleCallback: mock(async () => ({
          screen: { text: mdRaw('Вопрос') },
          awaitInput: { context: { step: 1 } },
        })),
      },
    });

    await transport.handleCallback(
      makeCtx({
        callbackQuery: {
          data: 'app:menu:open:~5',
        } as BotContext['callbackQuery'],
      }),
    );

    expect(session.dialog.input).toEqual({ context: { step: 1 } });
  });

  test('release снимает dialog.input', async () => {
    const { transport, session } = await startDialog({
      seq: 5,
      path: 'q/fill',
      uiApp: {
        handleCommand: mock(async (_update, _tg, s: BotSession) => {
          s.dialog = {
            path: 'q/fill',
            seq: 5,
            input: { context: { step: 2 } },
          };
          return {
            screen: { text: mdRaw('Вопрос'), keyboard: kb('menu:open') },
          };
        }),
        handleCallback: mock(async () => ({ release: true })),
      },
    });

    await transport.handleCallback(
      makeCtx({
        callbackQuery: {
          data: 'app:menu:open:~5',
        } as BotContext['callbackQuery'],
      }),
    );

    expect(session.dialog.input).toBeUndefined();
  });

  test('ошибка Telegram API: warn-лог вместо глушения, обработчик не падает', async () => {
    const logger = makeLogger();
    setGlobalLogger(logger);
    const api = makeMockBotApi({
      sendMessage: mock(async () => {
        throw new Error('Telegram down');
      }),
    });
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        s.dialog = { path: 'app/menu', seq: 5 };
        return { screen: { text: mdRaw('Экран') } };
      }),
    });
    const transport = new BotTransport(uiApp, api);

    await expect(
      transport.handleCommand(makeCommandCtx('/start')),
    ).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  test('handleMessage: без ожидания ввода → next(), uiApp не вызывается', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp();
    const transport = new BotTransport(uiApp, api);

    let nextCalled = false;
    await transport.handleMessage(makeCtx(), async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(callsOf(uiApp.handleMessage).length).toBe(0);
  });

  test('handleMessage: при ожидании ввода — форвард в uiApp и рендер', async () => {
    const { api, transport, uiApp } = await startDialog({
      seq: 5,
      path: 'q/fill',
      uiApp: {
        handleCommand: mock(async (_update, _tg, s: BotSession) => {
          s.dialog = { path: 'q/fill', seq: 5, input: {} };
          return {
            screen: { text: mdRaw('Вопрос'), keyboard: kb('menu:open') },
          };
        }),
        handleMessage: mock(
          async () =>
            ({ screen: { text: mdRaw('Принято') } }) as DialogResponse,
        ),
      },
    });

    await transport.handleMessage(
      makeCtx({ message: { text: 'Ответ' } as BotContext['message'] }),
      async () => {},
    );

    const msgs = callsOf(uiApp.handleMessage);
    expect(msgs[0]?.[0]).toMatchObject({ type: 'message', text: 'Ответ' });
    // Экран диалога наш — ответ рендерится edit'ом на месте
    const edits = callsOf(api.editMessageText);
    expect(edits.at(-1)?.[2]).toBe('Принято');
  });

  test('handleCommand: screen-ответ uiApp рендерится', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        s.dialog = { path: 'app/menu', seq: 8 };
        return { screen: { text: mdRaw('Отменено') } };
      }),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(makeCommandCtx('/cancel'));

    expect(
      callsOf(api.sendMessage)
        .map((c) => c[1])
        .at(-1),
    ).toBe('Отменено');
  });

  test('handleCommand: null → тихий пропуск (меню/реплику вернёт конвейер uiApp)', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp({ handleCommand: mock(async () => null) });
    const transport = new BotTransport(uiApp, api);

    await expect(
      transport.handleCommand(makeCommandCtx('/cancel')),
    ).resolves.toBeUndefined();
    expect(callsOf(api.sendMessage).length).toBe(0);
  });

  test('handleCommand: info-реплика рендерится, экран не трогается', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp({
      handleCommand: mock(async () => ({ info: { text: mdRaw('Справка') } })),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(makeCommandCtx('/help'));

    expect(
      callsOf(api.sendMessage)
        .map((c) => c[1])
        .at(-1),
    ).toBe('Справка');
    expect(callsOf(api.editMessageText).length).toBe(0);
  });
});

// ── notify: тон-каналы, сессия не трогается ──

// ── Единый вход команд (трек 1.1, ФР-4) ──

describe('parseCommandText — конверт слэш-команды', () => {
  test('/help без аргументов → { command: help, args: "" }', () => {
    const cmd = parseCommandText('/help', 42);

    expect(cmd).toEqual({
      type: 'command',
      command: 'help',
      args: '',
      telegramId: 42,
    });
  });

  test('суффикс @botname отбрасывается (группы)', () => {
    const cmd = parseCommandText('/cancel@u7_school_bot', 42);

    expect(cmd?.command).toBe('cancel');
    expect(cmd?.args).toBe('');
  });

  test('команда — первый токен, всё после неё — args (одной строкой)', () => {
    const cmd = parseCommandText('/log_level@bot   debug  all', 42);

    expect(cmd?.command).toBe('log_level');
    expect(cmd?.args).toBe('debug  all');
  });

  test('name/username отправителя попадают в конверт (гост-регистрация)', () => {
    const cmd = parseCommandText('/start', 42, {
      first_name: 'Анна',
      username: 'anna_u7',
    });

    expect(cmd?.name).toBe('Анна');
    expect(cmd?.username).toBe('anna_u7');
  });

  test('текст без ведущего / — не команда (null)', () => {
    expect(parseCommandText('привет', 42)).toBeNull();
    expect(parseCommandText('  /start', 42)).toBeNull();
  });

  test('голый «/» — не команда (null)', () => {
    expect(parseCommandText('/', 42)).toBeNull();
    expect(parseCommandText('/@bot', 42)).toBeNull();
  });
});

describe('BotTransport — единый вход команд (ФР-4)', () => {
  test('handleCommand: конверт уходит в uiApp.handleCommand, ответ рендерится', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp({
      handleCommand: mock(
        async () => ({ info: { text: mdRaw('Готово') } }) as DialogResponse,
      ),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(
      makeCtx({ message: { text: '/help@bot' } as BotContext['message'] }),
    );

    expect(uiApp.handleCommand).toHaveBeenCalledTimes(1);
    const [update, tgId] = callsOf(uiApp.handleCommand)[0] as [
      Record<string, unknown>,
      number,
    ];
    expect(update).toEqual({
      type: 'command',
      command: 'help',
      args: '',
      telegramId: 123,
      name: 'Test',
    });
    expect(tgId).toBe(123);
    // info-реплика отправлена
    expect(callsOf(api.sendMessage).length).toBe(1);
  });

  test('handleCommand: null от uiApp → тихий пропуск (ничего не отправляется)', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp();
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(
      makeCtx({ message: { text: '/cancel' } as BotContext['message'] }),
    );

    expect(uiApp.handleCommand).toHaveBeenCalledTimes(1);
    expect(callsOf(api.sendMessage).length).toBe(0);
  });

  test('handleMessage со слэш-текстом → конвейер команд, не ввод: next не зовётся', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp();
    const transport = new BotTransport(uiApp, api);
    const next = mock(async () => {});

    await transport.handleMessage(
      makeCtx({ message: { text: '/cancel' } as BotContext['message'] }),
      next,
    );

    expect(uiApp.handleCommand).toHaveBeenCalledTimes(1);
    expect(uiApp.handleMessage).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('handleMessage без слэша → как раньше: ввод (или next)', async () => {
    const api = makeMockBotApi();
    const uiApp = makeUiApp();
    const transport = new BotTransport(uiApp, api);
    const next = mock(async () => {});

    await transport.handleMessage(
      makeCtx({ message: { text: 'привет' } as BotContext['message'] }),
      next,
    );

    expect(uiApp.handleCommand).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('BotTransport — notify (тон-каналы)', () => {
  test('tone notice (по умолчанию): 🔔-заголовок, экран пользователя не ретирится', async () => {
    const { api, transport } = await startDialog({ seq: 5 });

    await transport.notify(123, { text: mdRaw('🎓 Ты зачислен') });

    const sends = callsOf(api.sendMessage);
    expect(sends.at(-1)?.[1]).toBe('🔔 *Уведомление:*\n\n🎓 Ты зачислен');
    expect(callsOf(api.editMessageText).length).toBe(0); // экран не тронут
  });

  test('tone info: заголовок «ℹ️ Информация» в стилистике уведомлений', async () => {
    const api = makeMockBotApi();
    const transport = new BotTransport(makeUiApp(), api);

    await transport.notify(123, { text: mdRaw('Тихая реплика'), tone: 'info' });

    expect(
      callsOf(api.sendMessage)
        .map((c) => c[1])
        .at(-1),
    ).toBe('ℹ️ *Информация:*\n\nТихая реплика');
  });

  test('битый md-литерал в notify — fail-fast, в Telegram не уходит', async () => {
    const api = makeMockBotApi();
    const transport = new BotTransport(makeUiApp(), api);

    await expect(
      transport.notify(123, { text: mdRaw('Голая точка.') }),
    ).rejects.toThrow();
    expect(callsOf(api.sendMessage).length).toBe(0);
  });
});

// ── Сжатие UUID (перенос из старого контракта) ──

describe('BotTransport — сжатие UUID', () => {
  test('сжимает UUID в callback_data кнопок', async () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const { pressed } = await startDialog({
      seq: 1,
      code: `stream:view:${uuid}`,
    });

    expect(pressed).toBe('stream:view:~a1b2c3d4:~1');
  });

  test('префикс app: не сжимается', async () => {
    const { pressed } = await startDialog({ seq: 1, code: 'app:main-menu' });

    expect(pressed).toBe('app:main-menu:~1');
  });

  test('коллизия одинаковых префиксов: суффикс и обратное разжатие', async () => {
    const uuid1 = 'a1b2c3d4-1111-2222-3333-444444444444';
    const uuid2 = 'a1b2c3d4-aaaa-bbbb-cccc-dddddddddddd';
    const api = makeMockBotApi();
    const uiApp = makeUiApp({
      handleCommand: mock(async (_update, _tg, s: BotSession) => {
        s.dialog = { path: 'streams/catalog', seq: 1 };
        return {
          screen: {
            text: mdRaw('Каталог'),
            keyboard: {
              rows: [
                [{ text: 'Поток 1', code: `stream:view:${uuid1}` }],
                [{ text: 'Поток 2', code: `stream:view:${uuid2}` }],
              ],
              isMultiple: false,
            },
          },
        };
      }),
      handleCallback: mock(async () => ({ screen: { text: mdRaw('Поток') } })),
    });
    const transport = new BotTransport(uiApp, api);

    await transport.handleCommand(makeCommandCtx('/start'));
    const sent = callsOf(api.sendMessage)[0];
    const kbSent = (
      sent?.[2] as {
        reply_markup: { inline_keyboard: { callback_data: string }[][] };
      }
    ).reply_markup.inline_keyboard;
    expect(kbSent[0]?.[0]?.callback_data).toBe('stream:view:~a1b2c3d4:~1');
    expect(kbSent[1]?.[0]?.callback_data).toBe('stream:view:~a1b2c3d4-1:~1');

    await transport.handleCallback(
      makeCtx({
        callbackQuery: {
          data: kbSent[1]?.[0]?.callback_data,
        } as BotContext['callbackQuery'],
      }),
    );
    expect(callsOf(uiApp.handleCallback)[0]?.[0]).toBe(`stream:view:${uuid2}`);
  });

  test('hex8 без маркера — не shortId, проходит как есть', async () => {
    const { transport, uiApp, pressed } = await startDialog({
      seq: 1,
      code: 'stream:view:a1b2c3d4',
    });

    await transport.handleCallback(
      makeCtx({
        callbackQuery: { data: pressed } as BotContext['callbackQuery'],
      }),
    );

    expect(callsOf(uiApp.handleCallback)[0]?.[0]).toBe('stream:view:a1b2c3d4');
  });
});

// ── Инварианты жизненного цикла (трек 1.1, Фаза 1): настоящий BotUiApp + транспорт ──

/** Контроллер интеграционной сборки: фикс-ответ на любой callback. */
class InvController extends BotController {
  readonly name: string;
  private readonly response: DialogResponse;

  constructor(name: string, response: DialogResponse = {}) {
    super();
    this.name = name;
    this.response = response;
  }

  override async handleCallback(): Promise<DialogResponse> {
    return this.response;
  }
}

/** uiApp интеграционной сборки: меню с кнопкой и мостом в другой контроллер. */
class InvUiApp extends BotUiApp {
  protected readonly menuPath = 'app/menu';

  #menuScreen: Screen = {
    text: mdRaw('Меню'),
    keyboard: {
      rows: [
        [{ text: '📂 Меню', code: 'app:menu:open' }],
        [{ text: '🌉 Мост', code: 'other:list:open' }],
      ],
      isMultiple: false,
    },
  };

  /** /start — уровень приложения (ФР-4, ревизия 2.1): reopen + welcome-экран. */
  override async handleCommand(
    update: CommandUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    if (update.command === 'start') {
      this.enterDialog(session, this.menuPath, 'reopen');
      return { screen: this.#menuScreen };
    }
    return super.handleCommand(update, tgId, session);
  }
}

/** Сборка: настоящий uiApp + транспорт (грамми — мок). */
function makeLifecycleRig(): {
  api: Api;
  uiApp: InvUiApp;
  transport: BotTransport;
} {
  const api = makeMockBotApi();
  const uiApp = new InvUiApp([
    new InvController('app'),
    new InvController('other', { screen: { text: mdRaw('Список') } }),
  ]);
  uiApp.init({
    appApi: {} as never,
    eventBus: {} as never,
    actorResolver: async () => ({ id: 'u1', name: 'Тест' }),
  });
  const transport = new BotTransport(uiApp as unknown as DialogUiAppPort, api);
  return { api, uiApp, transport };
}

/** callback_data кнопки [row][col] последнего отправленного сообщения. */
function sentButton(api: Api, row: number, col: number): string | undefined {
  const last = callsOf(api.sendMessage).at(-1);
  return (
    last?.[2] as {
      reply_markup?: { inline_keyboard?: { callback_data?: string }[][] };
    }
  )?.reply_markup?.inline_keyboard?.[row]?.[col]?.callback_data;
}

describe('BotTransport — инварианты жизненного цикла (настоящий uiApp)', () => {
  test('первый /start: кнопки welcome со штампом ~1 и живые', async () => {
    const { api, transport } = makeLifecycleRig();

    await transport.handleCommand(makeCommandCtx('/start'));

    const menuBtn = sentButton(api, 0, 0);
    expect(menuBtn).toBe('app:menu:open:~1');

    const ctx = makeCtx({
      callbackQuery: { data: menuBtn } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(ctx);
    // Кнопка принята: answerCallbackQuery без alert-текста
    expect(callsOf(ctx.answerCallbackQuery)[0]?.[0]).toBeUndefined();
  });

  test('повторный /start: reopen — seq++ (не no-op), кнопки ~1 умирают', async () => {
    const { api, transport } = makeLifecycleRig();

    await transport.handleCommand(makeCommandCtx('/start'));
    await transport.handleCommand(makeCommandCtx('/start'));

    const fresh = sentButton(api, 0, 0);
    expect(fresh).toBe('app:menu:open:~2');

    const ctx = makeCtx({
      callbackQuery: {
        data: 'app:menu:open:~1',
      } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(ctx);
    const ack = callsOf(ctx.answerCallbackQuery)[0] ?? [];
    expect(ack[0]).toMatchObject({ show_alert: true });
    expect((ack[0] as { text: string }).text).toContain('/start');
  });

  test('кнопка до /start → alert «Наберите /start»', async () => {
    const { transport } = makeLifecycleRig();

    const ctx = makeCtx({
      callbackQuery: {
        data: 'app:menu:open:~1',
      } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(ctx);

    const ack = callsOf(ctx.answerCallbackQuery)[0] ?? [];
    expect(ack[0]).toMatchObject({ show_alert: true });
    expect((ack[0] as { text: string }).text).toBe('Наберите /start');
  });

  test('дубль-тап по мосту: первый открывает диалог (seq++), второй — alert «Экран устарел»', async () => {
    const { api, transport } = makeLifecycleRig();

    await transport.handleCommand(makeCommandCtx('/start'));
    const bridge = sentButton(api, 1, 0);
    expect(bridge).toBe('other:list:open:~1');

    const first = makeCtx({
      callbackQuery: { data: bridge } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(first);
    expect(callsOf(first.answerCallbackQuery)[0]?.[0]).toBeUndefined();
    expect(
      callsOf(api.sendMessage)
        .map((c) => c[1])
        .at(-1),
    ).toBe('Список');

    const second = makeCtx({
      callbackQuery: { data: bridge } as BotContext['callbackQuery'],
    });
    await transport.handleCallback(second);
    const ack = callsOf(second.answerCallbackQuery)[0] ?? [];
    expect((ack[0] as { text: string }).text).toContain('устарел');
  });
});

// ── kickFromGroup (перенос) ──

describe('BotTransport — kickFromGroup', () => {
  test('мягкий кик: banChatMember на минуту + unbanChatMember', async () => {
    const api = makeMockBotApi();
    const transport = new BotTransport(makeUiApp(), api);

    await transport.kickFromGroup('-1002222222222', 1003);

    expect(api.banChatMember).toHaveBeenCalledWith(
      '-1002222222222',
      1003,
      expect.objectContaining({ until_date: expect.any(Number) }),
    );
    expect(api.unbanChatMember).toHaveBeenCalledWith('-1002222222222', 1003);
  });

  test('ошибка banChatMember не всплывает наружу (бот не админ)', async () => {
    const api = makeMockBotApi({
      banChatMember: mock(async () => {
        throw new Error('Bad Request: not enough rights');
      }),
    });
    const transport = new BotTransport(makeUiApp(), api);

    await expect(
      transport.kickFromGroup('-1002222222222', 1003),
    ).resolves.toBeUndefined();
    expect(api.unbanChatMember).not.toHaveBeenCalled();
  });
});
