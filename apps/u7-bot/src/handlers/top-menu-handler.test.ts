import { describe, expect, mock, test } from 'bun:test';
import type { Logger } from '@u7/core/shared';
import type { UserFacade } from '@u7/user/domain';
import type { BotContext } from '../context';
import { registerTopMenuHandler } from './top-menu-handler';

function makeMockLogger(): Logger {
  return {
    debug: mock(),
    info: mock(),
    warn: mock(),
    error: mock(),
    setLogLevel: mock(),
    getLogLevel: mock(() => 0 as any),
  };
}

function makeMockBot() {
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

const mockController = {
  handleUpdate: mock(async () => ({
    sendMessage: { text: 'Первый вопрос' },
  })),
} as any;

describe('registerTopMenuHandler', () => {
  test('регистрирует обработчики /start, /link, /start_onboarding', () => {
    const bot = makeMockBot();
    const config = { botAdminUuid: 'uuid', newsGroupUrl: 'url' } as any;
    const userFacade = {} as UserFacade;
    const logger = makeMockLogger();

    registerTopMenuHandler(bot, userFacade, mockController, config, logger);

    expect(bot.commands['start']).toBeDefined();
    expect(bot.commands['link_to_school_group']).toBeDefined();
    expect(bot.commands['start_onboarding']).toBeDefined();
  });

  test('/start вызывает registerGuest и показывает меню', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({ uuid: 'user-uuid' })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as any;
    const logger = makeMockLogger();

    registerTopMenuHandler(bot, userFacade, mockController, config, logger);

    const ctx = makeMockContext();
    await (bot.commands['start'] as any)(ctx);

    expect(userFacade.registerGuest).toHaveBeenCalledWith(
      123,
      'Тест',
      'admin-uuid',
    );
    expect(ctx.session.menu).toBe('main');
    expect((ctx as any).reply).toHaveBeenCalled();
  });

  test('/start показывает дружелюбное приветствие', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({ uuid: 'user-uuid' })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as any;
    const logger = makeMockLogger();

    registerTopMenuHandler(bot, userFacade, mockController, config, logger);

    const ctx = makeMockContext();
    await (bot.commands['start'] as any)(ctx);

    const replyText = (ctx as any).reply.mock.calls[0][0] as string;
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
    const config = { botAdminUuid: 'admin-uuid' } as any;
    const logger = makeMockLogger();

    registerTopMenuHandler(bot, userFacade, mockController, config, logger);

    const ctx = makeMockContext();
    await (bot.commands['start'] as any)(ctx);

    expect((ctx as any).reply).toHaveBeenCalled();
  });
});
