import { describe, expect, mock, test } from 'bun:test';
import type { Logger } from '@u7-scl/core/shared';
import type { OnboardingController } from '@u7-scl/onboarding';
import type { UserFacade } from '@u7-scl/user/domain';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { registerTopMenuHandler } from './top-menu-handler';

function makeMockLogger(): Logger {
  return {
    debug: mock(),
    info: mock(),
    warn: mock(),
    error: mock(),
    setLogLevel: mock(),
    getLogLevel: mock(() => 0),
    setSourceLevel: mock(() => 0),
  };
}

type MockBot = Bot<BotContext> & {
  commands: Record<string, (ctx: BotContext) => Promise<void>>;
};

function makeMockBot(): MockBot {
  const commands: Record<string, (ctx: BotContext) => Promise<void>> = {};

  const bot = {
    command: mock(
      (name: string, handler: (ctx: BotContext) => Promise<void>) => {
        commands[name] = handler;
      },
    ),
    commands,
  } as unknown as MockBot;

  return bot;
}

function makeMockContext(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: { id: 123, first_name: 'Тест' } as BotContext['from'],
    reply: mock(async () => ({
      message_id: 1,
    })) as unknown as BotContext['reply'],
    session: { menu: 'main' },
    ...overrides,
  } as unknown as BotContext;
}

const mockController = {
  handleUpdate: mock(async () => ({
    sendMessage: { text: 'Первый вопрос' },
  })),
} as unknown as OnboardingController;

describe('registerTopMenuHandler', () => {
  test('регистрирует обработчики /start, /link, /start_onboarding', () => {
    const bot = makeMockBot();
    const config = { botAdminUuid: 'uuid', newsGroupUrl: 'url' } as BotConfig;
    const userFacade = {} as UserFacade;
    const logger = makeMockLogger();

    registerTopMenuHandler(bot, userFacade, mockController, config, logger);

    expect(bot.commands.start).toBeDefined();
    expect(bot.commands.link_to_school_group).toBeDefined();
    expect(bot.commands.start_onboarding).toBeDefined();
  });

  test('/start вызывает registerGuest и показывает меню', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({ uuid: 'user-uuid' })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as unknown as BotConfig;
    const logger = makeMockLogger();

    registerTopMenuHandler(bot, userFacade, mockController, config, logger);

    const ctx = makeMockContext();
    await bot.commands.start?.(ctx);

    expect(userFacade.registerGuest).toHaveBeenCalledWith(
      123,
      'Тест',
      'admin-uuid',
    );
    expect(ctx.session.menu).toBe('main');
    expect(ctx.reply).toHaveBeenCalled();
  });

  test('/start показывает дружелюбное приветствие', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({ uuid: 'user-uuid' })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as unknown as BotConfig;
    const logger = makeMockLogger();

    registerTopMenuHandler(bot, userFacade, mockController, config, logger);

    const ctx = makeMockContext();
    await bot.commands.start?.(ctx);

    const replyText = (
      ctx.reply as unknown as {
        mock: { calls: Array<[string]> };
      }
    ).mock.calls[0]?.[0];
    expect(replyText).toContain('link_to_school_group');
    expect(replyText).toContain('start_onboarding');
  });

  test('/start не падает при ошибке registerGuest', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => {
        throw new Error('DB Down');
      }),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as unknown as BotConfig;
    const logger = makeMockLogger();

    registerTopMenuHandler(bot, userFacade, mockController, config, logger);

    const ctx = makeMockContext();
    await bot.commands.start?.(ctx);

    expect(ctx.reply).toHaveBeenCalled();
  });
});
