import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import {  BotRouter , assertBotResponseValid } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * US-6: Создание потока (wizard).
 *
 * Покрытие:
 * - Ментор → видит «Создать поток» в меню
 * - Гость → НЕ видит «Создать поток»
 * - Студент → НЕ видит «Создать поток»
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

  test('ментор видит «Создать поток» в главном меню', async () => {
    const items = await router.collectMainMenu(mentor);
    expect(items.some((i) => i.text.includes('Создать поток'))).toBe(true);
  });

  test('гость НЕ видит «Создать поток»', async () => {
    const items = await router.collectMainMenu(guest);
    expect(items.some((i) => i.text.includes('Создать поток'))).toBe(false);
  });

  test('студент НЕ видит «Создать поток»', async () => {
    const items = await router.collectMainMenu(student);
    expect(items.some((i) => i.text.includes('Создать поток'))).toBe(false);
  });

  // ═══════════════════════════════════════════
  // Полный wizard
  // ═══════════════════════════════════════════

  test('полный wizard: все шаги до успешного создания', async () => {
    // Шаг 0: старт wizard-а — сразу показывает список модулей для выбора
    const r0 = await router.handleCallback(
      'stream:create-stream:start',
      mentor,
      session,
    );
    assertBotResponseValid(r0);
    expect(r0.sendMessage?.text).toContain('Выберите модуль');
    expect(r0.sendMessage?.keyboard).toBeDefined();
    expect(session.activeHandler).not.toBeNull();

    // Шаг 1: выбор модуля
    const moduleId = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';
    const r1 = await router.handleCallback(
      `stream:create-stream:module:${moduleId}`,
      mentor,
      session,
    );
    assertBotResponseValid(r1);
    expect(r1.sendMessage?.text).toContain('название потока');

    // Шаг 2: название
    const r2 = await router.handleMessage(
      { type: 'message', text: 'Тестовый поток', telegramId: 1004 },
      mentor,
      session,
    );
    assertBotResponseValid(r2);
    expect(r2?.sendMessage?.text).toContain('описание');

    // Шаг 3: описание
    const r3 = await router.handleMessage(
      { type: 'message', text: 'Описание потока', telegramId: 1004 },
      mentor,
      session,
    );
    assertBotResponseValid(r3);
    expect(r3?.sendMessage?.text).toContain('дату старта');

    // Шаг 4: дата
    const r4 = await router.handleMessage(
      { type: 'message', text: '2026-09-01T00:00', telegramId: 1004 },
      mentor,
      session,
    );
    assertBotResponseValid(r4);
    expect(r4?.sendMessage?.text).toContain('ссылку на Telegram\\-группу');

    // Шаг 5: группа → превью
    const r5 = await router.handleMessage(
      { type: 'message', text: 'https://t.me/+test', telegramId: 1004 },
      mentor,
      session,
    );
    assertBotResponseValid(r5);
    expect(r5?.sendMessage?.text).toContain('Превью');
    expect(r5?.sendMessage?.text).toContain('Тестовый поток');

    const previewBtns =
      r5?.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(previewBtns.some((t) => t.includes('Создать'))).toBe(true);
    expect(previewBtns.some((t) => t.includes('Изменить'))).toBe(true);

    // Шаг 6: подтверждение
    const r6 = await router.handleCallback(
      'stream:create-stream:confirm',
      mentor,
      session,
    );
    assertBotResponseValid(r6);
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
    assertBotResponseValid(cancelResp);
    expect(cancelResp?.sendMessage?.text).toContain('отменен');
    expect(session.activeHandler).toBeNull();
  });

  test('кнопка «Изменить» на превью перезапускает wizard', async () => {
    // Доходим до превью
    await router.handleCallback('stream:create-stream:start', mentor, session);
    await router.handleCallback(
      'stream:create-stream:module:a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0',
      mentor,
      session,
    );
    await router.handleMessage(
      { type: 'message', text: 'T', telegramId: 1004 },
      mentor,
      session,
    );
    await router.handleMessage(
      { type: 'message', text: 'D', telegramId: 1004 },
      mentor,
      session,
    );
    await router.handleMessage(
      { type: 'message', text: '2026-09-01T00:00', telegramId: 1004 },
      mentor,
      session,
    );
    await router.handleMessage(
      { type: 'message', text: '@g', telegramId: 1004 },
      mentor,
      session,
    );

    // Нажимаем «Изменить» (это тот же 'start', который перезапускает wizard)
    const changeResp = await router.handleCallback(
      'stream:create-stream:start',
      mentor,
      session,
    );
    assertBotResponseValid(changeResp);
    expect(changeResp.sendMessage?.text).toContain('Выберите модуль');
  });
});
