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
