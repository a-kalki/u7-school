import { describe, expect, mock, test } from 'bun:test';
import type { OnboardingBotApp } from '@u7/onboarding';
import type { Bot } from 'grammy';
import type { BotContext } from '../context';
import { registerStartHandler } from './start-handler';

function makeMockBot(): Bot<BotContext> & {
  commands: Record<string, (ctx: BotContext) => Promise<void>>;
} {
  const commands: Record<string, (ctx: BotContext) => Promise<void>> = {};

  const bot = {
    command: mock(
      (name: string, handler: (ctx: BotContext) => Promise<void>) => {
        commands[name] = handler;
      },
    ),
    commands,
  } as any;

  return bot;
}

function makeMockContext(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: { id: 123, first_name: 'Тест' },
    reply: mock(async () => ({ message_id: 1 })),
    session: { menu: 'main' },
    ...overrides,
  } as unknown as BotContext;
}

describe('registerStartHandler', () => {
  test('регистрирует обработчик /start', () => {
    const bot = makeMockBot();
    const apiApp = {} as OnboardingBotApp;
    const config = { botAdminUuid: 'uuid', newsGroupUrl: 'url' } as any;

    registerStartHandler(bot, apiApp, config);

    expect(bot.commands['start']).toBeDefined();
  });

  test('/start вызывает registerGuest и показывает меню', async () => {
    const bot = makeMockBot();
    const apiApp = {
      execute: mock(async () => ({ uuid: 'user-uuid' })),
    } as unknown as OnboardingBotApp;
    const config = { botAdminUuid: 'admin-uuid', newsGroupUrl: 'url' } as any;

    registerStartHandler(bot, apiApp, config);

    const ctx = makeMockContext();
    await (bot.commands['start'] as any)(ctx);

    expect((apiApp as any).execute).toHaveBeenCalledWith(
      'register-guest',
      { telegramId: 123, name: 'Тест' },
      'admin-uuid',
    );
    expect(ctx.session.menu).toBe('main');
    expect((ctx as any).reply).toHaveBeenCalled();
  });

  test('/start показывает дружелюбное приветствие', async () => {
    const bot = makeMockBot();
    const apiApp = {
      execute: mock(async () => ({ uuid: 'user-uuid' })),
    } as unknown as OnboardingBotApp;
    const config = { botAdminUuid: 'admin-uuid', newsGroupUrl: 'url' } as any;

    registerStartHandler(bot, apiApp, config);

    const ctx = makeMockContext();
    await (bot.commands['start'] as any)(ctx);

    const replyText = (ctx as any).reply.mock.calls[0][0] as string;
    expect(replyText).toContain('Тест');
    // MarkdownV2 экранирует дефисы
    expect(replyText).toContain('link\\-to\\-school\\-group');
    expect(replyText).toContain('start\\-onboarding');
  });

  test('/start не падает при ошибке registerGuest', async () => {
    const bot = makeMockBot();
    const apiApp = {
      execute: mock(async () => {
        throw new Error('DB Down');
      }),
    } as unknown as OnboardingBotApp;
    const config = { botAdminUuid: 'admin-uuid', newsGroupUrl: 'url' } as any;

    registerStartHandler(bot, apiApp, config);

    const ctx = makeMockContext();
    // Не должно выбросить исключение
    await (bot.commands['start'] as any)(ctx);

    // Меню всё равно показывается
    expect((ctx as any).reply).toHaveBeenCalled();
  });
});
