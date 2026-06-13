// @ts-nocheck — старый тест, будет удалён в треке bot-cleanup
import { describe, expect, mock, test } from 'bun:test';
import type { Logger } from '@u7-scl/core/shared';
import type { OnboardingController } from '@u7-scl/onboarding';
import type { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
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
    on: mock((_event: string, _handler: (ctx: BotContext) => Promise<void>) => {
      // сохраняем для тестов
    }) as any,
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

const mockStreamController = {
  handleUpdate: mock(async () => ({
    sendMessage: { text: 'Ответ' },
  })),
} as unknown as StreamController;

describe('registerTopMenuHandler', () => {
  test('регистрирует обработчики /start, /link, /start_onboarding', () => {
    const bot = makeMockBot();
    const config = { botAdminUuid: 'uuid', newsGroupUrl: 'url' } as BotConfig;
    const userFacade = {} as UserFacade;
    const logger = makeMockLogger();

    registerTopMenuHandler(
      bot,
      userFacade,
      mockController,
      mockStreamController,
      config,
      logger,
    );

    expect(bot.commands.start).toBeDefined();
    expect(bot.commands.link_to_school_group).toBeDefined();
    expect(bot.commands.start_onboarding).toBeDefined();
  });

  test('/start вызывает registerGuest и показывает меню', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({ uuid: 'user-uuid', roles: [] })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as unknown as BotConfig;
    const logger = makeMockLogger();

    registerTopMenuHandler(
      bot,
      userFacade,
      mockController,
      mockStreamController,
      config,
      logger,
    );

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

  test('/start показывает дружелюбное приветствие с кнопками', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({ uuid: 'user-uuid', roles: [] })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as unknown as BotConfig;
    const logger = makeMockLogger();

    registerTopMenuHandler(
      bot,
      userFacade,
      mockController,
      mockStreamController,
      config,
      logger,
    );

    const ctx = makeMockContext();
    await bot.commands.start?.(ctx);

    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toContain('Привет');
    expect(replyCall[1].reply_markup).toBeDefined();
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

    registerTopMenuHandler(
      bot,
      userFacade,
      mockController,
      mockStreamController,
      config,
      logger,
    );

    const ctx = makeMockContext();
    await bot.commands.start?.(ctx);

    expect(ctx.reply).toHaveBeenCalled();
  });

  test('/start: GUEST видит 📚 Наши потоки, не видит 📖 Моя учёба', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({ uuid: 'u1', roles: [] })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as unknown as BotConfig;
    const logger = makeMockLogger();

    registerTopMenuHandler(
      bot,
      userFacade,
      mockController,
      mockStreamController,
      config,
      logger,
    );

    const ctx = makeMockContext();
    await bot.commands.start?.(ctx);

    const replyCall = (ctx.reply as any).mock.calls[0];
    const keyboard = replyCall[1].reply_markup;
    const btnTexts: string[] = keyboard.inline_keyboard
      .flat()
      .map((b: any) => b.text);
    expect(btnTexts.some((t) => t.includes('Моя учёба'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Наши потоки'))).toBe(true);
  });

  test('/start: STUDENT видит 📖 Моя учёба', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({
        uuid: 'u1',
        roles: ['STUDENT'],
      })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as unknown as BotConfig;
    const logger = makeMockLogger();

    registerTopMenuHandler(
      bot,
      userFacade,
      mockController,
      mockStreamController,
      config,
      logger,
    );

    const ctx = makeMockContext();
    await bot.commands.start?.(ctx);

    const replyCall = (ctx.reply as any).mock.calls[0];
    const keyboard = replyCall[1].reply_markup;
    const btnTexts: string[] = keyboard.inline_keyboard
      .flat()
      .map((b: any) => b.text);
    expect(btnTexts.some((t) => t.includes('Моя учёба'))).toBe(true);
  });

  test('/start: MENTOR видит 🛠️ Панель ментора', async () => {
    const bot = makeMockBot();
    const userFacade = {
      registerGuest: mock(async () => ({
        uuid: 'u1',
        roles: ['MENTOR'],
      })),
    } as unknown as UserFacade;
    const config = { botAdminUuid: 'admin-uuid' } as unknown as BotConfig;
    const logger = makeMockLogger();

    registerTopMenuHandler(
      bot,
      userFacade,
      mockController,
      mockStreamController,
      config,
      logger,
    );

    const ctx = makeMockContext();
    await bot.commands.start?.(ctx);

    const replyCall = (ctx.reply as any).mock.calls[0];
    const keyboard = replyCall[1].reply_markup;
    const btnTexts: string[] = keyboard.inline_keyboard
      .flat()
      .map((b: any) => b.text);
    expect(btnTexts.some((t) => t.includes('Панель ментора'))).toBe(true);
  });
});
