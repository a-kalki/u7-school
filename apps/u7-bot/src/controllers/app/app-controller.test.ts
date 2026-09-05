import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import type { MainMenuAction, MenuAggregator } from '@u7-scl/bot/u7-menu';
import { Role } from '@u7-scl/user/domain';

const SCHOOL_URL = 'https://t.me/u7_school_group';

const actor: User = {
  uuid: 'user-1',
  name: 'Гость',
  telegramId: 123,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeSession() {
  return { dialog: { path: 'app/menu', seq: 1 } };
}

/** Заглушка MenuAggregator для тестов */
function makeAggregator(
  menuItems: MainMenuAction[] = [],
  helpDescs: string[] = [],
): MenuAggregator<User> {
  return {
    collectAllMenuItems: async () => menuItems,
    collectAllHelpDescriptions: async () => helpDescs,
  };
}

/** Инициализирует контроллер с моком MenuAggregator */
function initCtrl(
  ctrl: AppController,
  menuItems: MainMenuAction[] = [],
  helpDescs: string[] = [],
): void {
  ctrl.init({
    appApi: {},
    uiApp: makeAggregator(menuItems, helpDescs),
  } as never);
}

describe('AppController', () => {
  // ── handleStart ──

  test('handleStart возвращает две кнопки: Сообщество и Помощь', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    const items = await ctrl.handleStart(actor);

    expect(items).toHaveLength(2);
    // Кнопка «Сообщество школы» — url, priority 90
    expect(items[0]!.text).toBe('💬 Сообщество школы');
    expect(items[0]!.kind).toBe('url');
    expect((items[0]! as { url?: string }).url).toBe(SCHOOL_URL);
    expect(items[0]!.priority).toBe(90);
    // Кнопка «Помощь» — callback, priority 100
    expect(items[1]!.text).toBe('❓ Помощь');
    expect(items[1]!.kind).toBe('callback');
    expect(items[1]!.priority).toBe(100);
  });

  // ── handleWelcome ──

  test('handleWelcome возвращает приветствие-экран с клавиатурой', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    initCtrl(ctrl, [
      {
        kind: 'callback',
        text: '📚 Потоки',
        action: 'stream:catalog',
        priority: 50,
      },
      {
        kind: 'callback',
        text: '❓ Помощь',
        action: 'app:help',
        priority: 100,
      },
      { kind: 'url', text: '💬 Сообщество', url: SCHOOL_URL, priority: 90 },
    ]);

    const screen = await ctrl.handleWelcome(actor);

    expect(screen).not.toBeNull();
    expect(String(screen!.text)).toContain('Привет');
    expect(String(screen!.text)).toContain('u7 schools');
    expect(String(screen!.text)).toContain('Помощь');
    expect(screen!.keyboard).toBeDefined();
    // Все кнопки (включая url) попадают в клавиатуру
    const rows = screen!.keyboard!.rows;
    expect(rows.length).toBeGreaterThanOrEqual(2);
    // url-кнопка «Сообщество» имеет url
    const communityRow = rows.find((r) => r[0]!.text === '💬 Сообщество');
    expect(communityRow).toBeDefined();
    expect(communityRow![0]!.url).toBe(SCHOOL_URL);
  });

  test('handleWelcome без MenuAggregator (до init) — только приветствие', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    // Не вызываем init — uiApp не задан

    const screen = await ctrl.handleWelcome(actor);

    expect(String(screen!.text)).toContain('Привет');
    expect(screen!.keyboard).toBeUndefined();
  });

  // ── handleHelpMessage ──

  test('handleHelpMessage: инструкция + описания, без клавиатуры (info-канал)', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    initCtrl(
      ctrl,
      [],
      [
        '💬 Сообщество школы — ссылка на группу',
        '📚 Потоки курсов — просмотр каталога (список)',
      ],
    );

    const screen = await ctrl.handleHelpMessage(actor);

    expect(screen).not.toBeNull();
    const text = String(screen!.text);
    expect(text).toContain('Как со мной работать?');
    expect(text).toContain('После выбора кнопки');
    expect(text).toContain('/cancel');
    expect(text).toContain('Сообщество школы');
    // Доменные описания экранируются как данные
    expect(text).toContain('просмотр каталога \\(список\\)');
    // info-реплика — без клавиатуры (транспорт её не рендерит)
    expect(screen!.keyboard).toBeUndefined();
  });

  test('handleHelpMessage без описаний — только инструкция', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    initCtrl(ctrl, [], []);

    const screen = await ctrl.handleHelpMessage(actor);

    expect(String(screen!.text)).toContain('Как со мной работать?');
    expect(String(screen!.text)).toContain('Вот что я умею:');
    expect(screen!.keyboard).toBeUndefined();
  });

  // ── handleCallback: main-menu ──

  test('handleCallback main-menu: экран меню без приветствия', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    initCtrl(ctrl, [
      {
        kind: 'callback',
        text: '📚 Потоки',
        action: 'stream:catalog',
        priority: 50,
      },
    ]);

    const res = await ctrl.handleCallback('main-menu', actor, makeSession());

    // Не должно быть приветственного текста
    expect(String(res.screen?.text)).not.toContain('Привет');
    expect(String(res.screen?.text)).toBe('Выберите действие:');
    expect(res.screen?.keyboard).toBeDefined();
  });

  // ── handleCallback: help ──

  test('handleCallback help → info-реплика с инструкцией', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    initCtrl(ctrl, [], ['📝 Заполнить анкету']);

    const res = await ctrl.handleCallback('help', actor, makeSession());

    // help-кнопка не строит экран диалога — тихая info-реплика
    expect(res.screen).toBeUndefined();
    expect(String(res.info?.text)).toContain('Как со мной работать?');
    expect(String(res.info?.text)).toContain('Заполнить анкету');
  });

  // ── handleCallback: неизвестный ──

  test('handleCallback с неизвестным действием возвращает ошибку-экран', async () => {
    const ctrl = new AppController(SCHOOL_URL);

    const res = await ctrl.handleCallback('unknown', actor, makeSession());

    expect(String(res.screen?.text)).toContain('Неизвестная команда');
  });
});
