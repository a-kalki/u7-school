import { describe, expect, mock, test } from 'bun:test';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { BotContext } from './context';
import { executeResponses } from './ui-utils';

// ── Фабрики ──

function makeMockContext(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: { id: 123, first_name: 'Тест', is_bot: false } as BotContext['from'],
    chat: { id: 123, type: 'private' } as BotContext['chat'],
    reply: mock(async () => ({
      message_id: 99,
    })) as unknown as BotContext['reply'],
    api: {
      editMessageText: mock(async () => ({
        message_id: 1,
      })) as unknown as BotContext['api']['editMessageText'],
    } as BotContext['api'],
    session: {} as SessionData,
    ...overrides,
  } as unknown as BotContext;
}

// ── А4: Задержка sendMessages ──

describe('executeResponses — sendDelayMs', () => {
  test('сообщения отправляются с указанной задержкой (sendDelayMs: 100)', async () => {
    const ctx = makeMockContext();
    const response: BotResponse = {
      sendMessages: [{ text: 'Первое' }, { text: 'Второе' }],
      sendDelayMs: 100,
    };

    const start = performance.now();
    await executeResponses(ctx, response);
    const elapsed = performance.now() - start;

    // Между 2 сообщениями — 1 пауза ≥ 100ms
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });

  test('дефолтная задержка = 1000 мс', async () => {
    const ctx = makeMockContext();
    const response: BotResponse = {
      sendMessages: [{ text: 'Первое' }, { text: 'Второе' }],
    };

    const start = performance.now();
    await executeResponses(ctx, response);
    const elapsed = performance.now() - start;

    // Между 2 сообщениями — 1 пауза ≥ 1000ms
    expect(elapsed).toBeGreaterThanOrEqual(900);
  });

  test('sendDelayMs: 0 — без задержки', async () => {
    const ctx = makeMockContext();
    const response: BotResponse = {
      sendMessages: [{ text: 'Первое' }, { text: 'Второе' }],
      sendDelayMs: 0,
    };

    const start = performance.now();
    await executeResponses(ctx, response);
    const elapsed = performance.now() - start;

    // Практически мгновенно
    expect(elapsed).toBeLessThan(50);
  });
});

// ── А1: Удаление старых кнопок при навигации (по умолчанию) ──

describe('executeResponses — удаление предыдущей клавиатуры', () => {
  test('по умолчанию убирает клавиатуру у предыдущего сообщения', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = {
      text: 'Предыдущее сообщение с кнопками',
      messageId: 42,
      keyboard: {
        rows: [[{ text: 'Кнопка', code: 'btn' }]],
        isMultiple: false,
      },
    };

    // Без keepPrevKeyboard — клавиатура удаляется
    const response: BotResponse = {
      sendMessage: { text: 'Новое сообщение' },
    };

    await executeResponses(ctx, response);

    // Проверяем, что editMessageText был вызван
    const editMock = ctx.api.editMessageText as any;
    expect(editMock).toHaveBeenCalled();
    const editCall = editMock.mock.calls[0];
    // chat_id, messageId, текст
    expect(editCall[0]).toBe(123);
    expect(editCall[1]).toBe(42);
    expect(editCall[2]).toBe('Предыдущее сообщение с кнопками');
    // reply_markup должен быть undefined
    expect(editCall[3]?.reply_markup).toBeUndefined();
  });

  test('без lastBotMessage — удаление игнорируется (нечего убирать)', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = undefined;

    const response: BotResponse = {
      sendMessage: { text: 'Новое сообщение' },
    };

    await executeResponses(ctx, response);

    // editMessageText не должен вызываться — нет предыдущего сообщения
    const editMock = ctx.api.editMessageText as any;
    expect(editMock).not.toHaveBeenCalled();
  });

  test('keepPrevKeyboard: true — НЕ убирает клавиатуру', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = {
      text: 'Сообщение с кнопками',
      messageId: 10,
      keyboard: {
        rows: [
          [
            { text: 'Да', code: 'yes' },
            { text: 'Нет', code: 'no' },
          ],
        ],
        isMultiple: false,
      },
    };

    const response: BotResponse = {
      sendMessage: { text: 'Новый ответ' },
      keepPrevKeyboard: true,
    };

    await executeResponses(ctx, response);

    // editMessageText НЕ должен вызываться для удаления клавиатуры
    const editMock = ctx.api.editMessageText as any;
    expect(editMock).not.toHaveBeenCalled();
  });

  test('при нажатии кнопки добавляет «Вы выбрали: ...» в текст предыдущего сообщения', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = {
      text: 'Каталог потоков',
      messageId: 5,
      parseMode: 'MarkdownV2',
      keyboard: {
        rows: [
          [{ text: '📚 Наши потоки', code: 'stream:catalog:list' }],
          [{ text: '↩️ Главное меню', code: 'app:main-menu' }],
        ],
        isMultiple: false,
      },
    };

    // Эмулируем callback — пользователь нажал «📚 Наши потоки»
    (ctx as any).callbackQuery = {
      data: 'stream:catalog:list',
      message: {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📚 Наши потоки', callback_data: 'stream:catalog:list' }],
            [{ text: '↩️ Главное меню', callback_data: 'app:main-menu' }],
          ],
        },
      },
    };

    const response: BotResponse = {
      sendMessage: { text: 'Новое сообщение' },
    };

    await executeResponses(ctx, response);

    const editMock = ctx.api.editMessageText as any;
    expect(editMock).toHaveBeenCalled();
    const editCall = editMock.mock.calls[0];
    // Текст должен содержать разделитель и «Вы выбрали: …»
    expect(editCall[2]).toContain('—————');
    expect(editCall[2]).toContain('Вы выбрали:');
    expect(editCall[2]).toContain('📚 Наши потоки');
    // MarkdownV2 — жирное выделение
    expect(editCall[2]).toContain('*Вы выбрали:*');
    // Клавиатура убрана
    expect(editCall[3]?.reply_markup).toBeUndefined();
    // parse_mode сохранён
    expect(editCall[3]?.parse_mode).toBe('MarkdownV2');
  });

  test('без MarkdownV2 — «Вы выбрали:» без жирного выделения', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = {
      text: 'Меню',
      messageId: 3,
      // parseMode отсутствует — plain text
      keyboard: {
        rows: [[{ text: 'Настройки', code: 'settings' }]],
        isMultiple: false,
      },
    };

    (ctx as any).callbackQuery = {
      data: 'settings',
      message: {
        reply_markup: {
          inline_keyboard: [[{ text: 'Настройки', callback_data: 'settings' }]],
        },
      },
    };

    const response: BotResponse = { sendMessage: { text: 'Новое' } };
    await executeResponses(ctx, response);

    const editCall = (ctx.api.editMessageText as any).mock.calls[0];
    expect(editCall[2]).toContain('—————');
    expect(editCall[2]).toContain('Вы выбрали: «Настройки»');
    // Без MarkdownV2 — без звёздочек
    expect(editCall[2]).not.toContain('*Вы выбрали:*');
  });

  test('экранирует спецсимволы MarkdownV2 в тексте кнопки «Вы выбрали»', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = {
      text: 'Список студентов',
      messageId: 3,
      parseMode: 'MarkdownV2',
      keyboard: {
        rows: [[{ text: '👤 Иван (50%) ⚠️', code: 'stream:monitor:detail:s1' }]],
        isMultiple: false,
      },
    };

    (ctx as any).callbackQuery = {
      data: 'stream:monitor:detail:s1',
      message: {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '👤 Иван (50%) ⚠️',
                callback_data: 'stream:monitor:detail:s1',
              },
            ],
          ],
        },
      },
    };

    const response: BotResponse = { sendMessage: { text: 'Карточка' } };
    await executeResponses(ctx, response);

    const editCall = (ctx.api.editMessageText as any).mock.calls[0];
    // Скобки и точка должны быть экранированы
    expect(editCall[2]).toContain('Иван \\(50%\\)');
    expect(editCall[2]).toContain('⚠️');
    // reply_markup убран
    expect(editCall[3]?.reply_markup).toBeUndefined();
  });

  test('без callbackQuery — текст не меняется (совместимость с /cancel и т.п.)', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = {
      text: 'Исходный текст',
      messageId: 7,
      keyboard: {
        rows: [[{ text: 'Кнопка', code: 'btn' }]],
        isMultiple: false,
      },
    };
    // callbackQuery отсутствует

    const response: BotResponse = {
      sendMessage: { text: 'Новое' },
    };

    await executeResponses(ctx, response);

    const editMock = ctx.api.editMessageText as any;
    expect(editMock).toHaveBeenCalled();
    const editCall = editMock.mock.calls[0];
    // Текст остался исходным
    expect(editCall[2]).toBe('Исходный текст');
  });

  test('keepPrevKeyboard: false — убирает клавиатуру (явное указание)', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = {
      text: 'Старая клавиатура',
      messageId: 5,
      keyboard: {
        rows: [[{ text: 'Тест', code: 'test' }]],
        isMultiple: false,
      },
    };

    const response: BotResponse = {
      sendMessage: { text: 'Новое' },
      keepPrevKeyboard: false,
    };

    await executeResponses(ctx, response);

    const editMock = ctx.api.editMessageText as any;
    expect(editMock).toHaveBeenCalled();
    expect(editMock.mock.calls[0][3]?.reply_markup).toBeUndefined();
  });
});

// ── А2: Хранение предыдущего сообщения в контексте ──

describe('executeResponses — lastBotMessage', () => {
  test('sendMessage сохраняет SendMessageDescription + messageId в сессию', async () => {
    const ctx = makeMockContext();
    const response: BotResponse = {
      sendMessage: { text: 'Тестовое сообщение', parseMode: 'MarkdownV2' },
    };

    await executeResponses(ctx, response);

    expect(ctx.session.lastBotMessage).toBeDefined();
    expect(ctx.session.lastBotMessage!.text).toBe('Тестовое сообщение');
    expect(ctx.session.lastBotMessage!.parseMode).toBe('MarkdownV2');
    expect(ctx.session.lastBotMessage!.messageId).toBe(99);
  });

  test('sendMessages сохраняет id последнего сообщения', async () => {
    const ctx = makeMockContext();
    // Каждое последующее сообщение будет получать новый message_id
    let callCount = 0;
    const replyMock = mock(async () => {
      callCount++;
      return { message_id: 100 + callCount };
    });
    (ctx as any).reply = replyMock;

    const response: BotResponse = {
      sendMessages: [
        { text: 'Первое' },
        { text: 'Второе' },
        { text: 'Третье' },
      ],
    };

    await executeResponses(ctx, response);

    expect(ctx.session.lastBotMessage).toBeDefined();
    expect(ctx.session.lastBotMessage!.text).toBe('Третье');
    expect(ctx.session.lastBotMessage!.messageId).toBe(103);
  });

  test('editMessage не меняет lastBotMessage', async () => {
    const ctx = makeMockContext();
    ctx.session.lastBotMessage = {
      text: 'Старое сообщение',
      messageId: 42,
    };

    const response: BotResponse = {
      editMessage: {
        messageId: 42,
        text: 'Отредактированное сообщение',
      },
    };

    await executeResponses(ctx, response);

    // lastBotMessage не должно измениться
    expect(ctx.session.lastBotMessage!.text).toBe('Старое сообщение');
    expect(ctx.session.lastBotMessage!.messageId).toBe(42);
  });
});
