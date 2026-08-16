import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { U7BotController } from './u7-bot-controller';
import { U7BotUiStory } from './u7-bot-ui-story';
import type { CbMainMenuAction, MainMenuAction } from './u7-menu';
import { U7BotUiApp } from './ui-app';

const actor: User = {
  uuid: 'user-1',
  name: 'Гость',
  telegramId: 123,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

class TestStory extends U7BotUiStory {
  readonly name: string;
  handleStartResult: MainMenuAction | null = null;

  constructor(name: string) {
    super();
    this.name = name;
  }

  async handleCallback(
    _action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {};
  }

  async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {};
  }

  override async handleStart(_actor: User): Promise<MainMenuAction | null> {
    return this.handleStartResult;
  }
}

class TestController extends U7BotController {
  readonly name: string;
  private _welcomeResult: BotResponse | null = null;
  private _helpResult: BotResponse | null = null;

  constructor(name: string) {
    super();
    this.name = name;
  }

  addStory(story: U7BotUiStory): void {
    this.stories.push(story);
  }

  withWelcomeResult(res: BotResponse | null): this {
    this._welcomeResult = res;
    return this;
  }

  withHelpResult(res: BotResponse | null): this {
    this._helpResult = res;
    return this;
  }

  override async handleWelcome(_actor: User): Promise<BotResponse | null> {
    return this._welcomeResult;
  }

  override async handleHelpMessage(_actor: User): Promise<BotResponse | null> {
    return this._helpResult;
  }
}

function makeResolve(app: U7BotUiApp) {
  return {
    eventBus: {} as never,
    actorResolver: async (_tgId: number) => actor,
    appApi: {} as never,
    uiApp: app,
  };
}

describe('Система меню U7', () => {
  test('U7BotUiStory: handleStart по умолчанию возвращает null', async () => {
    const story = new TestStory('test');
    expect(await story.handleStart(actor)).toBeNull();
  });

  test('U7BotController: handleStart агрегирует кнопки с префиксами', async () => {
    const ctrl = new TestController('test_ctrl');
    const s1 = new TestStory('story_one');
    s1.handleStartResult = {
      kind: 'callback',
      text: 'Кнопка 1',
      action: 'story_one:act1',
      priority: 20,
    };
    const s2 = new TestStory('story_two');
    s2.handleStartResult = {
      kind: 'callback',
      text: 'Кнопка 2',
      action: 'story_two:act2',
      priority: 10,
    };
    ctrl.addStory(s1);
    ctrl.addStory(s2);

    const result = (await ctrl.handleStart(actor)) as CbMainMenuAction[];

    expect(result).toHaveLength(2);
    expect(result[0]!.text).toBe('Кнопка 2');
    expect(result[0]!.action).toBe('test_ctrl:story_two:act2');
    expect(result[1]!.text).toBe('Кнопка 1');
    expect(result[1]!.action).toBe('test_ctrl:story_one:act1');
  });

  test('U7BotController: handleStart пропускает null-стори', async () => {
    const ctrl = new TestController('test_ctrl');
    const s1 = new TestStory('story_one');
    s1.handleStartResult = null;
    const s2 = new TestStory('story_two');
    s2.handleStartResult = {
      kind: 'callback',
      text: 'Кнопка',
      action: 'act',
      priority: 5,
    };
    ctrl.addStory(s1);
    ctrl.addStory(s2);

    const result = await ctrl.handleStart(actor);

    expect(result).toHaveLength(1);
    expect(result[0]!.text).toBe('Кнопка');
  });

  test('collectMainMenu агрегирует и сортирует', async () => {
    const c1 = new TestController('ctrl1');
    c1.addStory(
      Object.assign(new TestStory('b'), {
        handleStartResult: {
          kind: 'callback' as const,
          text: 'Б',
          action: 'ctrl1:b',
          priority: 10,
        },
      }),
    );

    const c2 = new TestController('ctrl2');
    c2.addStory(
      Object.assign(new TestStory('a'), {
        handleStartResult: {
          kind: 'callback' as const,
          text: 'А',
          action: 'ctrl2:a',
          priority: 5,
        },
      }),
    );

    const app = new U7BotUiApp([c1, c2]);
    const items = await app.collectMainMenu(actor);

    expect(items).toHaveLength(2);
    expect(items[0]!.text).toBe('А');
    expect(items[1]!.text).toBe('Б');
  });

  test('collectAllMenuItems агрегирует кнопки', async () => {
    const ctrl = new TestController('stream');
    ctrl.addStory(
      Object.assign(new TestStory('catalog'), {
        handleStartResult: {
          kind: 'callback' as const,
          text: 'Б',
          action: 'stream:b',
          priority: 10,
        },
      }),
    );
    ctrl.addStory(
      Object.assign(new TestStory('another'), {
        handleStartResult: {
          kind: 'callback' as const,
          text: 'А',
          action: 'stream:a',
          priority: 5,
        },
      }),
    );

    const app = new U7BotUiApp([ctrl]);
    const items = await app.collectAllMenuItems(actor);

    expect(items).toHaveLength(2);
    expect(items[0]!.text).toBe('А');
    expect(items[1]!.text).toBe('Б');
  });

  test('collectAllMenuItems с пустым списком', async () => {
    const app = new U7BotUiApp([]);
    const items = await app.collectAllMenuItems(actor);
    expect(items).toHaveLength(0);
  });

  test('collectAllHelpDescriptions собирает описания', async () => {
    const c1 = new TestController('ctrl1');
    c1.addStory(
      Object.assign(new TestStory('a'), {
        handleStartResult: {
          kind: 'callback' as const,
          text: 'A',
          action: 'a',
          priority: 10,
          description: 'Описание 1',
        },
      }),
    );

    const c2 = new TestController('ctrl2');
    c2.addStory(
      Object.assign(new TestStory('c'), {
        handleStartResult: {
          kind: 'callback' as const,
          text: 'C',
          action: 'c',
          priority: 30,
          description: 'Описание 3',
        },
      }),
    );

    const app = new U7BotUiApp([c1, c2]);
    const descs = await app.collectAllHelpDescriptions(actor);

    expect(descs).toEqual(['Описание 1', 'Описание 3']);
  });

  test('handleWelcome делегирует в AppController', async () => {
    const appCtrl = new TestController('app');
    appCtrl.withWelcomeResult({
      sendMessage: {
        text: 'Привет! 👋',
        keyboard: {
          rows: [[{ text: 'Кнопка', code: 'app:test' }]],
          isMultiple: false,
        },
      },
    });

    const app = new U7BotUiApp([appCtrl]);
    app.init(makeResolve(app));

    const res = await app.handleWelcome(1);

    expect(res.sendMessage?.text).toBe('Привет! 👋');
    expect(res.sendMessage?.keyboard?.rows[0]![0]!.text).toBe('Кнопка');
  });

  test('handleWelcome без контроллера app — fallback', async () => {
    const app = new U7BotUiApp([]);
    app.init(makeResolve(app));

    const res = await app.handleWelcome(1);

    expect(res.sendMessage?.text).toContain('Выберите действие');
  });

  test('handleHelp делегирует в AppController', async () => {
    const appCtrl = new TestController('app');
    appCtrl.withHelpResult({ sendMessage: { text: 'Как работать? 🤔' } });

    const app = new U7BotUiApp([appCtrl]);
    app.init(makeResolve(app));

    const res = await app.handleHelp(1);

    expect(res.sendMessage?.text).toContain('Как работать?');
  });

  test('handleHelp без контроллера app — fallback', async () => {
    const app = new U7BotUiApp([]);
    app.init(makeResolve(app));

    const res = await app.handleHelp(1);

    expect(res.sendMessage?.text).toContain('Нет доступных пунктов меню');
  });
});
