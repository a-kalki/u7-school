import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * Интеграционный тест S02-S04: карточка потока, программа, детали.
 *
 * Фикстурные ID:
 *   e0e0e0e0 — enrollment (🟡 JS Core, есть contentSnapshot)
 *   e1e1e1e1 — active     (🔵 JS Core 2, есть contentSnapshot)
 */
describe('ViewStreamStory (интеграционный)', () => {
  let app: TestApp;
  let router: UiApp;
  let guest: User;
  let mentor: User;
  const session: SessionData = { activeHandler: null };

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
  const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';
  const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

  beforeAll(async () => {
    app = await createTestApp('streams-view-int');
    const streamController = new StreamsController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    router = new UiApp([appController, streamController]);
    router.init(app.apiApp);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── S02: Карточка потока ──

  test('view: показывает карточку enrollment-потока', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('JS Core');
    expect(text).toContain('Ментор');
    expect(text).toContain('📚 Курс');
    expect(text).not.toContain('Неизвестная команда');
  });

  test('view: кнопки Программа, Детали, Назад к списку', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btns.some((t) => t.includes('Детали'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  test('view: нет менторских lifecycle-кнопок (гость)', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btns.some((t) => t.includes('В архив'))).toBe(false);
  });

  test('view: нет менторских lifecycle-кнопок (ментор своего потока)', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      mentor,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btns.some((t) => t.includes('В архив'))).toBe(false);
  });

  test('view: несуществующий поток — ошибка', async () => {
    const response = await router.handleCallback(
      'stream:view-stream:view:ffffffff-ffff-ffff-ffff-ffffffffffff',
      guest,
      session,
    );
    assertBotResponseValid(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  // ── S03: Программа потока ──

  test('program: показывает дерево проектов через tree-renderer', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:program:${ACTIVE_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Программа курса');
    expect(text).toContain('📁');
    expect(text).toContain('📝');
  });

  test('program: кнопка «Назад к потоку»', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:program:${ACTIVE_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── S04: Детали ──

  test('details: показывает детали потока', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:details:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Детали');
    expect(text).toContain('JS Core');
  });

  test('details: кнопка «Назад к потоку»', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:details:${ENROLLMENT_ID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── Сквозной сценарий ──

  test('сквозной: каталог → карточка → программа → назад', async () => {
    // 1. Открываем каталог
    const catalogResp = await router.handleCallback(
      'stream:catalog:list',
      guest,
      session,
    );
    assertBotResponseValid(catalogResp);

    // 2. Находим enrollment-поток (🟡)
    const buttons =
      catalogResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const streamBtn = buttons.find((b) => b.text.includes('🟡'));
    expect(streamBtn).toBeDefined();

    // 3. Открываем карточку потока
    const viewResp = await router.handleCallback(
      streamBtn!.code,
      guest,
      session,
    );
    assertBotResponseValid(viewResp);
    expect(viewResp.sendMessage?.text).toContain('JS Core');

    // 4. Нажимаем «Программа курса»
    const viewButtons =
      viewResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const programBtn = viewButtons.find((b) =>
      b.text.includes('Программа курса'),
    );
    expect(programBtn).toBeDefined();

    // 5. Открываем программу
    const programResp = await router.handleCallback(
      programBtn!.code,
      guest,
      session,
    );
    assertBotResponseValid(programResp);
    expect(programResp.sendMessage?.text).toContain('Программа курса');

    // 6. Нажимаем «Назад к потоку»
    const progButtons =
      programResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const backBtn = progButtons.find((b) => b.text.includes('Назад к потоку'));
    expect(backBtn).toBeDefined();

    // 7. Возвращаемся в карточку
    const backResp = await router.handleCallback(
      backBtn!.code,
      guest,
      session,
    );
    assertBotResponseValid(backResp);
    expect(backResp.sendMessage?.text).toContain('JS Core');
  });
});
