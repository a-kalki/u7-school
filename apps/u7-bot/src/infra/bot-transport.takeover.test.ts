import { describe, expect, mock, test } from 'bun:test';
import type { BotCommand, SessionData } from '@u7-scl/core/ui';
import type { Api } from 'grammy';
import type { U7BotUiApp } from '../core/ui-app';
import { BotTransport } from './bot-transport';

/**
 * Takeover-предупреждение в транспорте (spec FR-5): если команда несёт
 * takeover-кнопки (структурное поле) и у пользователя есть активное
 * действие (activeHandler) — вниз текста добавляется абстрактная строка.
 */

// ── Фабрики (конвенция bot-transport.test.ts) ──

function makeMockBotApi(): Api {
  return {
    sendMessage: mock(async () => ({ message_id: 100 })),
    editMessageText: mock(async () => ({ message_id: 1 })),
  } as unknown as Api;
}

function makeMockUiApp(): U7BotUiApp {
  return {
    handleWelcome: mock(async () => ({ sendMessage: { text: 'Привет' } })),
    handleHelp: mock(async () => ({ sendMessage: { text: 'Помощь' } })),
    handleCallback: mock(async () => ({ sendMessage: { text: 'ok' } })),
    handleMessage: mock(async () => ({ sendMessage: { text: 'принято' } })),
    handleCancel: mock(async () => ({ releaseInput: true })),
    handleTimeout: mock(async () => ({ releaseInput: true })),
  } as unknown as U7BotUiApp;
}

const WARNING_MD =
  '⚠️ Нажатие на кнопку приведёт к окончанию вашего текущего действия\\.';

function takeoverKeyboard() {
  return {
    rows: [
      [
        {
          text: '▶️ Продолжить анкету',
          code: 'questionnaire:fill:resume:c1',
          takeover: true,
        },
      ],
    ],
    isMultiple: false,
  };
}

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
  return { activeHandler: null, ...overrides };
}

async function sendWith(
  session: SessionData,
  command: BotCommand,
): Promise<{ api: Api; sessionMap: Map<number, SessionData> }> {
  const api = makeMockBotApi();
  const sessionMap = new Map<number, SessionData>([[123, session]]);
  const transport = new BotTransport(makeMockUiApp(), api, sessionMap);
  await transport.send(123, command);
  return { api, sessionMap };
}

// ── Тесты ──

describe('BotTransport — takeover-предупреждение', () => {
  test('takeover-кнопка + активное действие → строка внизу текста (MarkdownV2)', async () => {
    const session = makeSession({
      activeHandler: { path: 'learning/hub' },
    });

    const { api } = await sendWith(session, {
      sendMessage: {
        text: 'Вы начали заполнять анкету — продолжим?',
        parseMode: 'MarkdownV2',
        keyboard: takeoverKeyboard(),
      },
    });

    const call = (api.sendMessage as ReturnType<typeof mock>).mock.calls[0] as [
      number,
      string,
    ];
    expect(call[1]).toContain('продолжим?');
    expect(call[1]).toContain(WARNING_MD);
    expect(call[1]!.indexOf(WARNING_MD)).toBeGreaterThan(0);
  });

  test('без активного действия — строка НЕ добавляется', async () => {
    const session = makeSession();

    const { api } = await sendWith(session, {
      sendMessage: {
        text: 'Вы начали заполнять анкету — продолжим?',
        keyboard: takeoverKeyboard(),
      },
    });

    const call = (api.sendMessage as ReturnType<typeof mock>).mock.calls[0] as [
      number,
      string,
    ];
    expect(call[1]).not.toContain('окончанию вашего текущего действия');
  });

  test('активное действие, но кнопки обычные — строка НЕ добавляется', async () => {
    const session = makeSession({
      activeHandler: { path: 'learning/hub' },
    });

    const { api } = await sendWith(session, {
      sendMessage: {
        text: 'Обычное сообщение',
        keyboard: {
          rows: [[{ text: 'Ок', code: 'app:main-menu' }]],
          isMultiple: false,
        },
      },
    });

    const call = (api.sendMessage as ReturnType<typeof mock>).mock.calls[0] as [
      number,
      string,
    ];
    expect(call[1]).not.toContain('окончанию вашего текущего действия');
  });

  test('editMessage с takeover-кнопкой + активное действие → строка внизу', async () => {
    const session = makeSession({
      activeHandler: { path: 'learning/hub' },
    });

    const { api } = await sendWith(session, {
      editMessage: {
        messageId: 42,
        text: 'Приглашение',
        parseMode: 'MarkdownV2',
        keyboard: takeoverKeyboard(),
      },
    });

    const call = (api.editMessageText as ReturnType<typeof mock>).mock
      .calls[0] as [number, number, string];
    expect(call[2]).toContain(WARNING_MD);
  });

  test('без клавиатуры (takeover некуда смотреть) — строка не добавляется', async () => {
    const session = makeSession({
      activeHandler: { path: 'learning/hub' },
    });

    const { api } = await sendWith(session, {
      sendMessage: { text: 'Просто текст' },
    });

    const call = (api.sendMessage as ReturnType<typeof mock>).mock.calls[0] as [
      number,
      string,
    ];
    expect(call[1]).not.toContain('окончанию вашего текущего действия');
  });

  test('без parseMode — строка без экранирования точки', async () => {
    const session = makeSession({
      activeHandler: { path: 'learning/hub' },
    });

    const { api } = await sendWith(session, {
      sendMessage: {
        text: 'Продолжим?',
        keyboard: takeoverKeyboard(),
      },
    });

    const call = (api.sendMessage as ReturnType<typeof mock>).mock.calls[0] as [
      number,
      string,
    ];
    expect(call[1]).toContain(
      '⚠️ Нажатие на кнопку приведёт к окончанию вашего текущего действия.',
    );
  });
});
