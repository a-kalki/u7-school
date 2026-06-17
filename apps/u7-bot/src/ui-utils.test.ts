import { describe, expect, mock, test } from 'bun:test';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { BotContext } from './context';
import { executeResponses } from './ui-utils';

// ── Фабрики ──

function makeMockContext(
  overrides: Partial<BotContext> = {},
): BotContext {
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
