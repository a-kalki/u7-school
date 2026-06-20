import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import type { MainMenuAction, MenuAggregator } from '@u7-scl/core/ui';
import { AppController } from './app-controller';

const SCHOOL_URL = 'https://t.me/u7_school_group';

const actor: User = {
  uuid: 'user-1',
  name: 'Гость',
  telegramId: 123,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

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

describe('AppController', () => {
  // ── handleStart ──

  test('handleStart возвращает две кнопки: Сообщество и Помощь', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    const items = await ctrl.handleStart(actor);

    expect(items).toHaveLength(2);
    // Кнопка «Сообщество школы» — url, priority 100
    expect(items[1]!.text).toBe('💬 Сообщество школы');
    expect(items[1]!.kind).toBe('url');
    expect((items[1]! as any).url).toBe(SCHOOL_URL);
    expect(items[1]!.priority).toBe(100);
    // Кнопка «Помощь» — callback, priority 90
    expect(items[0]!.text).toBe('❓ Помощь');
    expect(items[0]!.kind).toBe('callback');
    expect(items[0]!.priority).toBe(90);
  });

  // ── handleHelpStart ──

  test('handleHelpStart возвращает описание кнопки сообщества', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    const desc = await ctrl.handleHelpStart(actor);

    expect(desc).toContain('Сообщество школы');
  });

  // ── handleWelcome ──

  test('handleWelcome возвращает приветствие с клавиатурой', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    ctrl.initMenuAggregator(makeAggregator([
      { kind: 'callback', text: '📚 Потоки', action: 'stream:catalog', priority: 50 },
      { kind: 'callback', text: '❓ Помощь', action: 'app:help', priority: 90 },
      { kind: 'url', text: '💬 Сообщество', url: SCHOOL_URL, priority: 100 },
    ]));

    const res = await ctrl.handleWelcome(actor);

    expect(res).not.toBeNull();
    expect(res!.sendMessage?.text).toContain('Привет');
    expect(res!.sendMessage?.text).toContain('u7 schools');
    expect(res!.sendMessage?.text).toContain('Помощь');
    expect(res!.sendMessage?.keyboard).toBeDefined();
    // Все кнопки (включая url) попадают в клавиатуру
    const rows = res!.sendMessage!.keyboard!.rows;
    expect(rows.length).toBeGreaterThanOrEqual(2);
    // url-кнопка «Сообщество» имеет url
    const communityRow = rows.find((r) => r[0]!.text === '💬 Сообщество');
    expect(communityRow).toBeDefined();
    expect(communityRow![0]!.url).toBe(SCHOOL_URL);
  });

  test('handleWelcome без MenuAggregator (до init) — только приветствие', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    // Не вызываем initMenuAggregator

    const res = await ctrl.handleWelcome(actor);

    expect(res!.sendMessage?.text).toContain('Привет');
    expect(res!.sendMessage?.keyboard).toBeUndefined();
  });

  // ── handleHelpMessage ──

  test('handleHelpMessage возвращает инструкцию и описания', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    ctrl.initMenuAggregator(makeAggregator([], [
      '💬 Сообщество школы — ссылка на группу',
      '📚 Наши потоки — просмотр каталога',
    ]));

    const res = await ctrl.handleHelpMessage(actor);

    expect(res).not.toBeNull();
    const text = res!.sendMessage!.text;
    expect(text).toContain('Как со мной работать?');
    expect(text).toContain('После выбора кнопки');
    expect(text).toContain('/cancel');
    expect(text).toContain('Сообщество школы');
    expect(text).toContain('Наши потоки');

    // Кнопка «Назад»
    expect(res!.sendMessage!.keyboard).toBeDefined();
    expect(res!.sendMessage!.keyboard!.rows[0]![0]!.text).toBe('🔙 Назад');
  });

  test('handleHelpMessage без описаний — только инструкция', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    ctrl.initMenuAggregator(makeAggregator([], []));

    const res = await ctrl.handleHelpMessage(actor);

    expect(res!.sendMessage!.text).toContain('Как со мной работать?');
    expect(res!.sendMessage!.text).toContain('Вот что я умею:');
    // Кнопка «Назад» есть даже без описаний
    expect(res!.sendMessage!.keyboard).toBeDefined();
  });

  // ── handleCallback: main-menu ──

  test('handleCallback main-menu возвращает клавиатуру без приветствия', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    ctrl.initMenuAggregator(makeAggregator([
      { kind: 'callback', text: '📚 Потоки', action: 'stream:catalog', priority: 50 },
    ]));

    const res = await ctrl.handleCallback('main-menu', actor, { activeHandler: null });

    // Не должно быть приветственного текста
    expect(res.sendMessage?.text).not.toContain('Привет');
    expect(res.sendMessage?.text).toBe('Выберите действие:');
    expect(res.sendMessage?.keyboard).toBeDefined();
  });

  // ── handleCallback: help ──

  test('handleCallback help вызывает handleHelpMessage', async () => {
    const ctrl = new AppController(SCHOOL_URL);
    ctrl.initMenuAggregator(makeAggregator([], ['📝 Заполнить анкету']));

    const res = await ctrl.handleCallback('help', actor, { activeHandler: null });

    expect(res.sendMessage?.text).toContain('Как со мной работать?');
    expect(res.sendMessage?.text).toContain('Заполнить анкету');
  });

  // ── handleCallback: неизвестный ──

  test('handleCallback с неизвестным действием возвращает ошибку', async () => {
    const ctrl = new AppController(SCHOOL_URL);

    const res = await ctrl.handleCallback('unknown', actor, { activeHandler: null });

    expect(res.sendMessage?.text).toContain('Неизвестная команда');
  });
});
