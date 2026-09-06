import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { type Logger, LogLevel, setGlobalLogger } from '@u7-scl/core/shared';
import type { CommandReaction, CommandUpdate } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';

const SCHOOL_URL = 'https://t.me/u7_school_group';

const actor: User = {
  uuid: 'user-1',
  name: 'Гость',
  telegramId: 123,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeLogger(): Logger & { setLogLevel: ReturnType<typeof mock> } {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    setLogLevel: mock(() => {}),
    getLogLevel: mock(() => 0),
    setSourceLevel: mock(() => {}),
  } as unknown as Logger & { setLogLevel: ReturnType<typeof mock> };
}

function makeCtrl(adminIds: number[] = []): AppController {
  return new AppController(SCHOOL_URL, adminIds);
}

function makeCommand(
  command: string,
  args = '',
  telegramId = 123,
): CommandUpdate {
  return { type: 'command', command, args, telegramId };
}

describe('AppController — menuButtons', () => {
  test('две кнопки: Сообщество (url, 90) и Помощь (callback, 100) — по приоритету', () => {
    const ctrl = makeCtrl();

    const buttons = ctrl.menuButtons(actor);

    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.text).toBe('💬 Сообщество школы');
    expect(buttons[0]!.kind).toBe('url');
    expect((buttons[0]! as { url?: string }).url).toBe(SCHOOL_URL);
    expect(buttons[0]!.priority).toBe(90);
    expect(buttons[1]!.text).toBe('❓ Помощь');
    expect(buttons[1]!.kind).toBe('callback');
    expect(buttons[1]!.priority).toBe(100);
    // код кнопки Помощь — префиксован контроллером
    expect((buttons[1]! as { action?: string }).action).toBe('app:help');
  });
});

describe('AppController — handleCommand: /log_level', () => {
  test('от НЕ-админа → stop{} (тишина), уровень не меняется', async () => {
    const logger = makeLogger();
    setGlobalLogger(logger);
    const ctrl = makeCtrl([999]);

    const reaction = await ctrl.handleCommand(
      makeCommand('log_level', 'debug'),
      actor,
      { dialog: { path: 'app/menu', seq: 1 } },
    );

    expect(reaction.reaction).toBe('stop');
    if (reaction.reaction === 'stop') {
      expect(reaction.response).toEqual({});
    }
    expect(logger.setLogLevel).not.toHaveBeenCalled();
  });

  test('от админа с аргументом → stop{info}, уровень изменён', async () => {
    const logger = makeLogger();
    setGlobalLogger(logger);
    const ctrl = makeCtrl([123]);

    const reaction = await ctrl.handleCommand(
      makeCommand('log_level', 'debug'),
      actor,
      { dialog: { path: 'app/menu', seq: 1 } },
    );

    expect(logger.setLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
    expect(reaction.reaction).toBe('stop');
    if (reaction.reaction !== 'stop') throw new Error('ожидался stop');
    expect(String(reaction.response.info?.text)).toContain('debug');
  });

  test('от админа без аргументов → stop{info} с инструкцией', async () => {
    setGlobalLogger(makeLogger());
    const ctrl = makeCtrl([123]);

    const reaction = await ctrl.handleCommand(
      makeCommand('log_level', ''),
      actor,
      { dialog: { path: 'app/menu', seq: 1 } },
    );

    if (reaction.reaction !== 'stop') throw new Error('ожидался stop');
    expect(String(reaction.response.info?.text)).toContain('Использование');
    // MarkdownV2: подчёркивание экранировано
    expect(String(reaction.response.info?.text)).toContain('log\\_level');
  });

  test('от админа с неизвестным уровнем → stop{info} со списком уровней', async () => {
    setGlobalLogger(makeLogger());
    const ctrl = makeCtrl([123]);

    const reaction = await ctrl.handleCommand(
      makeCommand('log_level', 'bogus'),
      actor,
      { dialog: { path: 'app/menu', seq: 1 } },
    );

    if (reaction.reaction !== 'stop') throw new Error('ожидался stop');
    expect(String(reaction.response.info?.text)).toContain('bogus');
    expect(String(reaction.response.info?.text)).toContain('debug');
  });
});

describe('AppController — handleCommand: прочее', () => {
  test('прочая команда → super (свои стори): community pass → pass', async () => {
    const ctrl = makeCtrl();

    const reaction: CommandReaction = await ctrl.handleCommand(
      makeCommand('help'),
      actor,
      { dialog: { path: 'app/menu', seq: 1 } },
    );

    expect(reaction).toEqual({ reaction: 'pass' });
  });

  test('кнопка сообщества в menuButtons — код url, описание для /help', () => {
    const ctrl = makeCtrl();
    ctrl.init({
      appApi: {},
      eventBus: {},
      actorResolver: async () => actor,
    } as never);

    const buttons: MenuButton[] = ctrl.menuButtons(actor);
    const community = buttons.find((b) => b.text.includes('Сообщество'));

    expect(community?.description).toBeDefined();
  });
});

describe('AppController — handleCallback (стори-роутинг)', () => {
  test('community:* → делегируется в стори', async () => {
    const ctrl = makeCtrl();
    ctrl.init({
      appApi: {} as never,
      eventBus: {} as never,
      actorResolver: async () => actor,
    } as never);

    const response = await ctrl.handleCallback('community:any', actor, {
      dialog: { path: 'app/community', seq: 1 },
    });

    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('неизвестный префикс → экран неизвестной команды', async () => {
    const ctrl = makeCtrl();
    ctrl.init({
      appApi: {} as never,
      eventBus: {} as never,
      actorResolver: async () => actor,
    } as never);

    const response = await ctrl.handleCallback('zzz:act', actor, {
      dialog: { path: 'app/menu', seq: 1 },
    });

    expect(String(response.screen?.text)).toContain('Неизвестная');
  });
});
