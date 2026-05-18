import { describe, expect, mock, test } from 'bun:test';
import type { OnboardingController } from '@u7/onboarding';
import type { Bot } from 'grammy';
import type { BotContext } from '../context';
import { registerStartOnboardingHandler } from './start-onboarding-handler';

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

describe('registerStartOnboardingHandler', () => {
  test('регистрирует обработчик /start-onboarding', () => {
    const bot = makeMockBot();
    const controller = {} as OnboardingController;
    const config = { botAdminUuid: 'uuid' } as any;

    registerStartOnboardingHandler(bot, controller, config);

    expect(bot.commands['start-onboarding']).toBeDefined();
  });

  test('/start-onboarding устанавливает menu = onboarding', async () => {
    const bot = makeMockBot();
    const controller = {
      handleUpdate: mock(async () => ({
        sendMessage: { text: 'Первый вопрос' },
      })),
    } as unknown as OnboardingController;
    const config = { botAdminUuid: 'admin-uuid' } as any;

    registerStartOnboardingHandler(bot, controller, config);

    const ctx = makeMockContext();
    await (bot.commands['start-onboarding'] as any)(ctx);

    expect(ctx.session.menu).toBe('onboarding');
  });

  test('/start-onboarding форвардит команду start в контроллер', async () => {
    const bot = makeMockBot();
    const controller = {
      handleUpdate: mock(async () => ({
        sendMessage: { text: 'Первый вопрос' },
      })),
    } as unknown as OnboardingController;
    const config = { botAdminUuid: 'admin-uuid' } as any;

    registerStartOnboardingHandler(bot, controller, config);

    const ctx = makeMockContext();
    await (bot.commands['start-onboarding'] as any)(ctx);

    expect(controller.handleUpdate).toHaveBeenCalledWith(
      {
        type: 'command',
        command: 'start',
        telegramId: 123,
        name: 'Тест',
      },
      'admin-uuid',
    );
    expect((ctx as any).reply).toHaveBeenCalledWith(
      'Первый вопрос',
      { reply_markup: undefined, parse_mode: undefined },
    );
  });
});
