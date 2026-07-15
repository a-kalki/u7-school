import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/app/ui';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import { CourseController } from '@u7-scl/course/ui';
import type { TestApp } from '../helpers/test-app';
import { createTestApp } from '../helpers/test-app';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

/**
 * Интеграционные тесты: главное меню, /start, /help.
 * Проверяет сквозное взаимодействие AppController → BotRouter → контроллеры.
 */
describe('Главное меню (интеграционные)', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;
  let student: User;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('main-menu-int');
    const streamController = new StreamController(app.streamModule);
    const courseController = new CourseController(app.courseModule);
    const appController = new AppController(SCHOOL_GROUP_URL);
    streamController.init(app.apiApp);
    courseController.init(app.apiApp);
    appController.init(app.apiApp);
    router = new BotRouter([appController, streamController, courseController]);
    appController.initMenuAggregator(router);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Кнопка «Сообщество школы» ──

  test('гость видит кнопку «Сообщество школы» в главном меню', async () => {
    const menu = await router.collectMainMenu(guest);
    const btn = menu.find((i) => i.text === '💬 Сообщество школы');
    expect(btn).toBeDefined();
    expect(btn!.kind).toBe('url');
    expect((btn as any).url).toBe(SCHOOL_GROUP_URL);
    expect(btn!.priority).toBe(90);
  });

  test('студент видит кнопку «Сообщество школы»', async () => {
    const menu = await router.collectMainMenu(student);
    expect(menu.some((i) => i.text === '💬 Сообщество школы')).toBe(true);
  });

  test('ментор видит кнопку «Сообщество школы»', async () => {
    const menu = await router.collectMainMenu(mentor);
    expect(menu.some((i) => i.text === '💬 Сообщество школы')).toBe(true);
  });

  test('кнопка «Помощь» в конце меню (самый низкий приоритет)', async () => {
    const menu = await router.collectMainMenu(guest);
    const last = menu[menu.length - 1]!;
    expect(last.text).toBe('❓ Помощь');
  });

  // ── Кнопка «Помощь» ──

  test('гость видит кнопку «Помощь» в главном меню', async () => {
    const menu = await router.collectMainMenu(guest);
    const btn = menu.find((i) => i.text === '❓ Помощь');
    expect(btn).toBeDefined();
    expect(btn!.kind).toBe('callback');
    if (btn!.kind === 'callback') {
      expect(btn!.action).toBe('app:help');
    }
    expect(btn!.priority).toBe(100);
  });

  // ── handleWelcome (/start) ──

  test('handleWelcome возвращает приветствие с клавиатурой', async () => {
    const response = await router.handleWelcome(guest);
    expect(response.sendMessage?.text).toContain('Привет');
    expect(response.sendMessage?.text).toContain('u7 schools');
    expect(response.sendMessage?.text).toContain('Помощь');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleWelcome для ментора', async () => {
    const response = await router.handleWelcome(mentor);
    expect(response.sendMessage?.text).toContain('Привет');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  // ── handleHelp (/help) ──

  test('handleHelp возвращает инструкцию и описания + кнопку Назад', async () => {
    const response = await router.handleHelp(guest);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Как со мной работать?');
    expect(text).toContain('Программы курсов');
    expect(text).toContain('Потоки курсов');
    expect(text).toContain('Сообщество школы');
    expect(text).toContain('/cancel');
    // Кнопка «Назад»
    expect(response.sendMessage?.keyboard).toBeDefined();
    expect(response.sendMessage?.keyboard!.rows[0]![0]!.text).toBe('🔙 Назад');
    expect(response.sendMessage?.keyboard!.rows[0]![0]!.code).toBe(
      'app:main-menu',
    );
  });

  test('handleHelp для студента включает «Моя учёба»', async () => {
    const response = await router.handleHelp(student);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');
    // Кнопка Назад
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  // ── app:main-menu через handleCallback ──

  test('app:main-menu возвращает клавиатуру без приветствия', async () => {
    const response = await router.handleCallback('app:main-menu', guest, {
      activeHandler: null,
    });

    expect(response.sendMessage?.text).toBe('Выберите действие:');
    expect(response.sendMessage?.text).not.toContain('Привет');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  // ── app:help через handleCallback ──

  test('app:help возвращает инструкцию + кнопку Назад', async () => {
    const response = await router.handleCallback('app:help', guest, {
      activeHandler: null,
    });

    expect(response.sendMessage?.text).toContain('Как со мной работать?');
    expect(response.sendMessage?.keyboard).toBeDefined();
    expect(response.sendMessage?.keyboard!.rows[0]![0]!.text).toBe('🔙 Назад');
  });

  // ── В главном меню нет кнопки «Назад» ──

  test('в главном меню нет кнопки «Назад» (guest)', async () => {
    const menu = await router.collectMainMenu(guest);
    expect(menu.some((i) => i.text.includes('Назад'))).toBe(false);
  });
});
