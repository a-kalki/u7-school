import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/app/ui';
import type { MainMenuAction, SessionData } from '@u7-scl/core/ui';
import { BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../helpers/test-app';
import { createTestApp } from '../helpers/test-app';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
const NO_SESSION: SessionData = { activeHandler: null };

/**
 * E2E: Главное меню — кнопка «Сообщество школы», «Назад», /help.
 */
describe('Главное меню (E2E)', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;
  let student: User;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-main-menu');
    const streamController = new StreamController(app.streamModule);
    const appController = new AppController(SCHOOL_GROUP_URL);
    streamController.init(app.apiApp);
    appController.init(app.apiApp);
    router = new BotRouter([appController, streamController]);
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
    expect(btn!.priority).toBe(100);
  });

  test('студент видит кнопку «Сообщество школы»', async () => {
    const menu = await router.collectMainMenu(student);
    expect(menu.some((i) => i.text === '💬 Сообщество школы')).toBe(true);
  });

  test('ментор видит кнопку «Сообщество школы»', async () => {
    const menu = await router.collectMainMenu(mentor);
    expect(menu.some((i) => i.text === '💬 Сообщество школы')).toBe(true);
  });

  test('кнопка «Сообщество школы» в конце меню (низкий приоритет)', async () => {
    const menu = await router.collectMainMenu(guest);
    const last = menu[menu.length - 1]!;
    expect(last.text).toBe('💬 Сообщество школы');
  });

  // ── Команда /help ──

  test('/help возвращает описания пунктов меню', async () => {
    const descriptions = await router.collectHelp(guest);
    expect(descriptions.length).toBeGreaterThanOrEqual(2);
    expect(descriptions.some((d) => d.includes('Наши потоки'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Сообщество школы'))).toBe(true);
  });

  test('/help у гостя не содержит «Моя учёба»', async () => {
    const descriptions = await router.collectHelp(guest);
    expect(descriptions.some((d) => d.includes('Моя учёба'))).toBe(false);
  });

  // ── Кнопка «Назад» (проверяется в router.test.ts, здесь — косвенно через меню) ──

  test('в главном меню нет кнопки «Назад» (activeHandler = null)', async () => {
    const menu = await router.collectMainMenu(guest);
    expect(menu.some((i) => i.text.includes('Назад'))).toBe(false);
  });

  // ── app:main-menu ──

  test('app:main-menu пересобирает меню без сброса activeHandler', async () => {
    const session: SessionData = {
      activeHandler: { path: 'stream/some-path' },
    };

    const response = await router.handleCallback(
      'app:main-menu',
      guest,
      session,
    );

    // Должен вернуть mainMenu с actions
    expect(response.mainMenu).toBeDefined();
    expect(response.mainMenu!.actions.length).toBeGreaterThanOrEqual(1);

    // activeHandler НЕ должен быть сброшен
    expect(session.activeHandler).not.toBeNull();
    expect(session.activeHandler!.path).toBe('stream/some-path');
  });
});
