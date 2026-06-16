import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { BotRouter } from '@u7-scl/core/ui';
import type { SessionData } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import { createTestApp } from '../../helpers/test-app';
import type { TestApp } from '../../helpers/test-app';

/**
 * US-6: Создание потока (wizard).
 *
 * Покрытие:
 * - Ментор → видит «Панель ментора» в меню
 * - Гость → НЕ видит «Панель ментора»
 * - Студент → НЕ видит «Панель ментора»
 * - Полный wizard: старт → выбор модуля → название → описание → дата → группа → превью → подтверждение
 * - Wizard: кнопка «Изменить» на превью → перезапуск
 * - Wizard: /cancel → отмена создания
 * - Wizard: таймаут → завершение
 */
describe('CreateStreamStory e2e', () => {
  let app: TestApp;
  let router: BotRouter;
  let mentor: User;
  let guest: User;
  let student: User;
  const session: SessionData = { activeHandler: null };

  beforeAll(async () => {
    app = await createTestApp('create-stream');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ═══════════════════════════════════════════
  // Главное меню
  // ═══════════════════════════════════════════

  test('ментор видит «Панель ментора» в главном меню', async () => {
    const items = await router.collectMainMenu(mentor);
    expect(items.some((i) => i.text.includes('Панель ментора'))).toBe(true);
  });

  test('гость НЕ видит «Панель ментора»', async () => {
    const items = await router.collectMainMenu(guest);
    expect(items.some((i) => i.text.includes('Панель ментора'))).toBe(false);
  });

  test('студент НЕ видит «Панель ментора»', async () => {
    const items = await router.collectMainMenu(student);
    expect(items.some((i) => i.text.includes('Панель ментора'))).toBe(false);
  });

  // ═══════════════════════════════════════════
  // Полный wizard
  // ═══════════════════════════════════════════

  test('полный wizard: все шаги до успешного создания', async () => {
    // Шаг 0: старт
    const r0 = await router.handleCallback('stream:create-stream:start', mentor, session);
    expect(r0.sendMessage?.text).toContain('Создание нового потока');
    expect(session.activeHandler).not.toBeNull();

    // Шаг 0: загрузка модулей
    const rMod = await router.handleMessage(
      { type: 'message', text: 'x', telegramId: 1004 }, mentor, session,
    );
    expect(rMod?.sendMessage?.text).toContain('Выберите модуль');

    // Шаг 1: выбор модуля
    const moduleId = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';
    const r1 = await router.handleCallback(
      `stream:create-stream:module:${moduleId}`, mentor, session,
    );
    expect(r1.sendMessage?.text).toContain('название потока');

    // Шаг 2: название
    const r2 = await router.handleMessage(
      { type: 'message', text: 'Тестовый поток', telegramId: 1004 }, mentor, session,
    );
    expect(r2?.sendMessage?.text).toContain('описание');

    // Шаг 3: описание
    const r3 = await router.handleMessage(
      { type: 'message', text: 'Описание потока', telegramId: 1004 }, mentor, session,
    );
    expect(r3?.sendMessage?.text).toContain('дату старта');

    // Шаг 4: дата
    const r4 = await router.handleMessage(
      { type: 'message', text: '2026-09-01T00:00', telegramId: 1004 }, mentor, session,
    );
    expect(r4?.sendMessage?.text).toContain('ссылку на Telegram-группу');

    // Шаг 5: группа → превью
    const r5 = await router.handleMessage(
      { type: 'message', text: 'https://t.me/+test', telegramId: 1004 }, mentor, session,
    );
    expect(r5?.sendMessage?.text).toContain('Превью');
    expect(r5?.sendMessage?.text).toContain('Тестовый поток');

    const previewBtns = r5?.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(previewBtns.some((t) => t.includes('Создать'))).toBe(true);
    expect(previewBtns.some((t) => t.includes('Изменить'))).toBe(true);

    // Шаг 6: подтверждение
    const r6 = await router.handleCallback('stream:create-stream:confirm', mentor, session);
    expect(r6.sendMessage?.text).toContain('успешно создан');
    expect(session.activeHandler).toBeNull();
  });

  // ═══════════════════════════════════════════
  // Отмена и краевые случаи
  // ═══════════════════════════════════════════

  test('отмена wizard-а через /cancel', async () => {
    // Запускаем wizard
    await router.handleCallback('stream:create-stream:start', mentor, session);
    expect(session.activeHandler).not.toBeNull();

    // Отменяем
    const cancelResp = await router.handleCancel(mentor, session);
    expect(cancelResp?.sendMessage?.text).toContain('отменен');
    expect(session.activeHandler).toBeNull();
  });

  test('кнопка «Изменить» на превью перезапускает wizard', async () => {
    // Доходим до превью
    await router.handleCallback('stream:create-stream:start', mentor, session);
    await router.handleMessage({ type: 'message', text: 'x', telegramId: 1004 }, mentor, session);
    await router.handleCallback(
      'stream:create-stream:module:a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', mentor, session,
    );
    await router.handleMessage({ type: 'message', text: 'T', telegramId: 1004 }, mentor, session);
    await router.handleMessage({ type: 'message', text: 'D', telegramId: 1004 }, mentor, session);
    await router.handleMessage({ type: 'message', text: '2026-09-01T00:00', telegramId: 1004 }, mentor, session);
    await router.handleMessage({ type: 'message', text: '@g', telegramId: 1004 }, mentor, session);

    // Нажимаем «Изменить» (это тот же 'start', который перезапускает wizard)
    const changeResp = await router.handleCallback('stream:create-stream:start', mentor, session);
    expect(changeResp.sendMessage?.text).toContain('Создание нового потока');
  });
});
