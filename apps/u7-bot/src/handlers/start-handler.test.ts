import { describe, expect, mock, test } from 'bun:test';
import type { OnboardingBotApp, OnboardingController } from '@u7/onboarding';
import { Role } from '@u7/user/domain';
import type { Bot } from 'grammy';
import type { BotContext } from '../context';
import { registerStartHandler } from './start-handler';

function makeMockBot(): Bot<BotContext> & {
  commands: Record<string, (ctx: BotContext) => Promise<void>>;
  callbacks: Record<string, (ctx: BotContext) => Promise<void>>;
} {
  const commands: Record<string, (ctx: BotContext) => Promise<void>> = {};
  const callbacks: Record<string, (ctx: BotContext) => Promise<void>> = {};

  const bot = {
    command: mock(
      (name: string, handler: (ctx: BotContext) => Promise<void>) => {
        commands[name] = handler;
      },
    ),
    callbackQuery: mock(
      (name: string, handler: (ctx: BotContext) => Promise<void>) => {
        callbacks[name] = handler;
      },
    ),
    commands,
    callbacks,
  } as any;

  return bot;
}

function makeMockContext(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: { id: 123, first_name: 'Тест' },
    reply: mock(async () => ({ message_id: 1 })),
    answerCallbackQuery: mock(async () => {}),
    session: {},
    ...overrides,
  } as unknown as BotContext;
}

describe('registerStartHandler', () => {
  test('регистрирует обработчик /start', () => {
    const bot = makeMockBot();
    const controller = {} as OnboardingController;
    const apiApp = {} as OnboardingBotApp;
    const config = { botAdminUuid: 'uuid', newsGroupUrl: 'url' } as any;

    registerStartHandler(bot, controller, apiApp, config);

    expect(bot.commands['start']).toBeDefined();
  });

  test('/start убеждается в наличии пользователя GUEST', async () => {
    const bot = makeMockBot();
    const controller = {} as OnboardingController;

    const apiApp = {
      execute: mock(async (name: string) => {
        if (name === 'get-user-by-telegram-id') return undefined;
        if (name === 'ensure-user-with-role') return { uuid: 'user-uuid' };
        if (name === 'get-onboarding-state') return { status: 'none_active', completedCount: 0 };
        throw new Error(`unexpected command: ${name}`);
      }),
    } as unknown as OnboardingBotApp;

    const config = { botAdminUuid: 'admin-uuid', newsGroupUrl: 'url' } as any;

    registerStartHandler(bot, controller, apiApp, config);

    const ctx = makeMockContext();
    await (bot.commands['start'] as any)(ctx);

    expect((apiApp as any).execute).toHaveBeenCalledWith(
      'ensure-user-with-role',
      { telegramId: 123, role: Role.GUEST },
      'admin-uuid',
    );
    expect((ctx as any).reply).toHaveBeenCalled();
  });

  test('flow candidate показывает сообщение о новой заявке', async () => {
    const bot = makeMockBot();
    const controller = {} as OnboardingController;

    const apiApp = {
      execute: mock(async (name: string) => {
        if (name === 'get-user-by-telegram-id')
          return { uuid: 'u', roles: [Role.GUEST, Role.CANDIDATE] };
        if (name === 'ensure-user-with-role') return { uuid: 'u' };
        if (name === 'get-onboarding-state') return { status: 'none_active', completedCount: 1 };
        throw new Error(`unexpected command: ${name}`);
      }),
    } as unknown as OnboardingBotApp;

    const config = { botAdminUuid: 'admin-uuid', newsGroupUrl: 'url' } as any;

    registerStartHandler(bot, controller, apiApp, config);

    const ctx = makeMockContext();
    await (bot.commands['start'] as any)(ctx);

    const replyCall = (ctx as any).reply.mock.calls[0];
    expect(replyCall[0]).toContain('уже заполняли заявку');
  });
});
