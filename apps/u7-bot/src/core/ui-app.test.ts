import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { AppController } from '../controllers/app/app-controller';
import { U7BotUiApp } from './ui-app';

const SCHOOL_URL = 'https://t.me/u7_school_group';

const actor: User = {
  uuid: 'user-1',
  name: 'Иван',
  telegramId: 123,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeUiApp(): U7BotUiApp {
  const uiApp = new U7BotUiApp([new AppController(SCHOOL_URL)]);
  const resolve: {
    appApi: never;
    eventBus: never;
    actorResolver: () => Promise<User>;
    uiApp: unknown;
  } = {
    appApi: {} as never,
    eventBus: { subscribe: () => () => {} } as never,
    actorResolver: async () => actor,
    uiApp: undefined,
  };
  // AppController собирает меню через MenuAggregator — им и есть сам uiApp
  resolve.uiApp = uiApp;
  uiApp.init(resolve as never);
  return uiApp;
}

describe('U7BotUiApp — экраны меню', () => {
  test('/start (buildMenuScreen): полное приветствие + меню', async () => {
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'zz/old', seq: 4 } };

    const response = await uiApp.handleWelcome(123, session);

    expect(String(response.screen?.text)).toContain('Привет, Иван');
    expect(String(response.screen?.text)).toContain('u7 schools');
    expect(response.screen?.keyboard).toBeDefined();
    expect(session.dialog.path).toBe('app/menu');
    expect(session.dialog.seq).toBe(5);
  });

  test('/cancel (buildCancelMenuScreen): КОРОТКОЕ меню без приветствия', async () => {
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'zz/old', seq: 4 } };

    const response = await uiApp.handleCancel(123, session);

    expect(String(response?.screen?.text)).toBe('Выберите действие:');
    expect(String(response?.screen?.text)).not.toContain('Привет');
    expect(response?.screen?.keyboard).toBeDefined();
    expect(session.dialog.path).toBe('app/menu');
    expect(session.dialog.seq).toBe(5);
  });

  test('клавиатура меню содержит кнопку «Помощь» с кодом app:help', async () => {
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'zz/old', seq: 1 } };

    const response = await uiApp.handleCancel(123, session);

    const codes = response?.screen?.keyboard?.rows.flatMap((r) =>
      r.map((b) => b.code),
    );
    expect(codes).toContain('app:help');
  });
});
