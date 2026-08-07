import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * Интеграционный тест S01: витрина потоков (CatalogStory).
 *
 * Фикстурные потоки:
 *   e0e0e0e0 — enrollment (🟡 JS Core)
 *   e1e1e1e1 — active     (🔵 JS Core 2)
 *   e2e2e2e2 — completed  (🟢 JS Core 3)
 *   e3e3e3e3 — archived   (⚫ JS Core 4)
 */
describe('CatalogStory (интеграционный)', () => {
  let app: TestApp;
  let router: UiApp;
  let guest: User;
  const session: SessionData = { activeHandler: null };

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

  beforeAll(async () => {
    app = await createTestApp('streams-catalog-int');
    const streamController = new StreamsController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    router = new UiApp([appController, streamController]);
    router.init(app.apiApp);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('list: показывает enrollment и active потоки', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list',
      guest,
      session,
    );
    assertBotResponseValid(response);
    expect(response.sendMessage?.text).toContain('Потоки курсов');
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // В фикстурах есть enrollment (JS Core) и active (JS Core 2)
    expect(btns.some((t) => t.includes('JS Core — Поток 1'))).toBe(true);
    expect(btns.some((t) => t.includes('JS Core — Поток 2'))).toBe(true);
    // Кнопка Главное меню в конце
    expect(btns.some((t) => t.includes('Главное меню'))).toBe(true);
  });

  test('list: скрывает completed и archived по умолчанию', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list',
      guest,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Завершённые и архивные потоки не видны
    expect(btns.some((t) => t.includes('Поток 3'))).toBe(false);
    expect(btns.some((t) => t.includes('Поток 4'))).toBe(false);
    // Но есть кнопка-переключатель
    expect(btns.some((t) => t.includes('Вкл. завершённые'))).toBe(true);
  });

  test('list-with-completed: показывает завершённые', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list-with-completed',
      guest,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Поток 3'))).toBe(true);
    expect(btns.some((t) => t.includes('Только активные') || t.includes('Вкл. архивированные'))).toBe(true);
  });

  test('handleStart: кнопка «📚 Потоки курсов» в главном меню', async () => {
    const menu = await router.collectMainMenu(guest);
    const streamBtn = menu.find((i) => i.text === '📚 Потоки курсов');
    expect(streamBtn).toBeDefined();
    expect(streamBtn!.kind).toBe('callback');
    if (streamBtn!.kind === 'callback') {
      expect(streamBtn!.action).toBe('stream:catalog:list');
    }
    expect(streamBtn!.priority).toBe(15);
  });

  test('легенда цветных кружков', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list',
      guest,
      session,
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('🟡');
    expect(text).toContain('🔵');
    expect(text).toContain('🟢');
    expect(text).toContain('⚫');
  });
});
