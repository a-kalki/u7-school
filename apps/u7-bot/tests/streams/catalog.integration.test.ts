import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  stampedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

/**
 * Интеграционный тест S01: витрина потоков (CatalogStory).
 *
 * Контракт «Диалог и Экран»: ассерты — по DialogResponse, захваченному
 * на границе uiApp. Коды прямых вызовов штампуются актуальным штампом
 * открытого экрана (transport валидирует штампы на входе).
 *
 * Фикстурные потоки:
 *   e0e0e0e0 — enrollment (🟡 JS Core)
 *   e1e1e1e1 — active     (🔵 JS Core 2)
 *   e2e2e2e2 — completed  (🟢 JS Core 3)
 *   e3e3e3e3 — archived   (⚫ JS Core 4)
 */
describe('CatalogStory (интеграционный)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let guest: User;

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

  beforeAll(async () => {
    app = await createTestApp('streams-catalog-int');
    const streamController = new StreamsController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    transport = createTestBotTransport(app, [appController, streamController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  /** Открывает диалог гостя и вызывает код каталога с актуальным штампом. */
  async function openCatalog(action: 'list' | 'list-with-completed') {
    await transport.handleStart(transport.makeBotContext(guest.telegramId));
    return transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: stampedCode(
          transport,
          guest.telegramId,
          `stream:catalog:${action}`,
        ),
      }),
    );
  }

  test('list: показывает enrollment и active потоки', async () => {
    const response = await openCatalog('list');
    expect(response.screen?.text).toContain('Потоки курсов');
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // В фикстурах есть enrollment (JS Core) и active (JS Core 2)
    expect(btns.some((t) => t.includes('JS Core — Поток 1'))).toBe(true);
    expect(btns.some((t) => t.includes('JS Core — Поток 2'))).toBe(true);
    // Кнопка Главное меню в конце
    expect(btns.some((t) => t.includes('Главное меню'))).toBe(true);
  });

  test('list: скрывает completed и archived по умолчанию', async () => {
    const response = await openCatalog('list');
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Завершённые и архивные потоки не видны
    expect(btns.some((t) => t.includes('Поток 3'))).toBe(false);
    expect(btns.some((t) => t.includes('Поток 4'))).toBe(false);
    // Но есть кнопка-переключатель
    expect(btns.some((t) => t.includes('Вкл. завершённые'))).toBe(true);
  });

  test('list-with-completed: показывает завершённые', async () => {
    const response = await openCatalog('list-with-completed');
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Поток 3'))).toBe(true);
    expect(
      btns.some(
        (t) =>
          t.includes('Только активные') || t.includes('Вкл. архивированные'),
      ),
    ).toBe(true);
  });

  test('handleStart: кнопка «📚 Потоки курсов» в главном меню', async () => {
    await transport.handleStart(transport.makeBotContext(guest.telegramId));
    const menu = await transport.collectMainMenu(guest);
    const streamBtn = menu.find((i) => i.text === '📚 Потоки курсов');
    expect(streamBtn).toBeDefined();
    expect(streamBtn!.kind).toBe('callback');
    if (streamBtn!.kind === 'callback') {
      expect(streamBtn!.action).toBe('stream:catalog:list');
    }
    expect(streamBtn!.priority).toBe(15);
  });

  test('легенда цветных кружков', async () => {
    const response = await openCatalog('list');
    const text = response.screen?.text ?? '';
    expect(text).toContain('🟡');
    expect(text).toContain('🔵');
    expect(text).toContain('🟢');
    expect(text).toContain('⚫');
  });

  test('переключатель «Вкл. завершённые» работает кнопкой с экрана', async () => {
    const tgId = guest.telegramId;
    await transport.handleStart(transport.makeBotContext(tgId));
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Потоки курсов'),
      }),
    );
    const response = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Вкл. завершённые'),
      }),
    );
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Поток 3'))).toBe(true);
  });
});
