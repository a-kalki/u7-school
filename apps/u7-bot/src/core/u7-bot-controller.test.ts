import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { type Logger, setGlobalLogger } from '@u7-scl/core/shared';
import type { BotSession, BotUpdate, DialogResponse } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { U7BotController } from './u7-bot-controller';
import { U7BotUiStory } from './u7-bot-ui-story';

const actor: User = {
  uuid: 'u1',
  name: 'Тест',
  telegramId: 1,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeLogger(): Logger {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    setLogLevel: mock(() => {}),
    getLogLevel: mock(() => 0),
    setSourceLevel: mock(() => {}),
  } as unknown as Logger;
}

/** Стори с настраиваемыми кнопками меню. */
class ButtonedStory extends U7BotUiStory {
  readonly name: string;
  readonly buttons: MenuButton[];

  constructor(name: string, buttons: MenuButton[]) {
    super();
    this.name = name;
    this.buttons = buttons;
  }

  override async menuButtons(): Promise<MenuButton[]> {
    return this.buttons;
  }

  override async handleCallback(): Promise<DialogResponse> {
    return {};
  }
  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: BotSession,
  ): Promise<DialogResponse> {
    return {};
  }
}

/** Стори, чья асинхронная проверка видимости падает. */
class FailingStory extends U7BotUiStory {
  readonly name = 'boom';

  override async menuButtons(): Promise<MenuButton[]> {
    throw new Error('фасад недоступен');
  }

  override async handleCallback(): Promise<DialogResponse> {
    return {};
  }
  override async handleMessage(): Promise<DialogResponse> {
    return {};
  }
}

class ButtonedController extends U7BotController {
  readonly name = 'ctrl';

  constructor(stories: U7BotUiStory[]) {
    super();
    this.stories.push(...stories);
  }
}

describe('U7BotController — menuButtons', () => {
  test('сбор от стори: callback-коды префиксуются контроллером, url — как есть', async () => {
    const ctrl = new ButtonedController([
      new ButtonedStory('one', [
        {
          kind: 'callback',
          text: 'Кнопка',
          action: 'one:open',
          priority: 10,
        },
      ]),
      new ButtonedStory('two', [
        {
          kind: 'url',
          text: 'Ссылка',
          url: 'https://example.com',
          priority: 5,
        },
      ]),
    ]);

    const buttons = await ctrl.menuButtons(actor);

    expect(buttons).toHaveLength(2);
    // сортировка по приоритету
    expect(buttons[0]!.kind).toBe('url');
    expect(buttons[1]!.kind).toBe('callback');
    expect((buttons[1] as { action: string }).action).toBe('ctrl:one:open');
  });

  test('без кнопок у стори — пустой список', async () => {
    const ctrl = new ButtonedController([new ButtonedStory('one', [])]);

    expect(await ctrl.menuButtons(actor)).toEqual([]);
  });

  test('асинхронная видимость: кнопки резолвятся после await (async-проверки стори)', async () => {
    const ctrl = new ButtonedController([
      new ButtonedStory('one', [
        {
          kind: 'callback',
          text: 'Кнопка',
          action: 'one:open',
          priority: 10,
        },
      ]),
    ]);

    const buttons = await ctrl.menuButtons(actor);

    expect(buttons.map((b) => b.text)).toEqual(['Кнопка']);
  });

  test('параллельный сбор: обе стори стартуют до резолва первой (Promise.all)', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = 0;

    class GatedStory extends ButtonedStory {
      override async menuButtons(): Promise<MenuButton[]> {
        started++;
        await gate;
        return this.buttons;
      }
    }

    const ctrl = new ButtonedController([
      new GatedStory('one', [
        {
          kind: 'callback',
          text: 'Первая',
          action: 'one:open',
          priority: 10,
        },
      ]),
      new GatedStory('two', [
        {
          kind: 'callback',
          text: 'Вторая',
          action: 'two:open',
          priority: 20,
        },
      ]),
    ]);

    const pending = ctrl.menuButtons(actor);
    // При последовательном сборе вторая стори не стартовала бы до
    // резолва гейта первой — тест завис бы/падал на started.
    expect(started).toBe(2);
    release();
    const buttons = await pending;
    expect(buttons.map((b) => b.text)).toEqual(['Первая', 'Вторая']);
  });

  test('упавшая стори скрывает только свои кнопки: меню цело + warn', async () => {
    const logger = makeLogger();
    setGlobalLogger(logger);
    const ctrl = new ButtonedController([
      new FailingStory(),
      new ButtonedStory('two', [
        {
          kind: 'callback',
          text: 'Живая',
          action: 'two:open',
          priority: 20,
        },
      ]),
    ]);

    const buttons = await ctrl.menuButtons(actor);

    expect(buttons.map((b) => b.text)).toEqual(['Живая']);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
