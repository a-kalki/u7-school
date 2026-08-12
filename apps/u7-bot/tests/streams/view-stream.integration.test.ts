// @ts-nocheck
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { LearningController } from '@u7-scl/bot/learning/controller';
import { MentorController } from '@u7-scl/bot/mentor/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestApp,
  type TestBotUiApp,
} from '@u7-scl/test-helpers/test-app';

/**
 * Интеграционный тест S02-S04: карточка потока, программа, детали.
 *
 * Фикстурные ID:
 *   e0e0e0e0 — enrollment (🟡 JS Core, есть contentSnapshot)
 *   e1e1e1e1 — active     (🔵 JS Core 2, есть contentSnapshot)
 */
describe('ViewStreamStory (интеграционный)', () => {
  let app: TestApp;
  let router: TestBotUiApp;
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
    const learningController = new LearningController();
    const mentorController = new MentorController();
    router = new UiApp([
      appController,
      streamController,
      learningController,
      mentorController,
    ]);
    router.init(app.apiApp, (tgId: number) =>
      app.userFacade.getUserByTelegramId(tgId),
    );
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
      guest.telegramId,
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
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b: any) => b.text) ?? [];
    expect(btns.some((t: string) => t.includes('Программа курса'))).toBe(true);
    expect(btns.some((t: string) => t.includes('Детали'))).toBe(true);
    expect(btns.some((t: string) => t.includes('Назад к списку'))).toBe(true);
  });

  test('view: нет менторских lifecycle-кнопок (гость)', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b: any) => b.text) ?? [];
    expect(btns.some((t: string) => t.includes('Запустить'))).toBe(false);
    expect(btns.some((t: string) => t.includes('Завершить'))).toBe(false);
    expect(btns.some((t: string) => t.includes('В архив'))).toBe(false);
  });

  test('view: нет менторских lifecycle-кнопок (ментор своего потока)', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ENROLLMENT_ID}`,
      mentor.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b: any) => b.text) ?? [];
    expect(btns.some((t: string) => t.includes('Запустить'))).toBe(false);
    expect(btns.some((t: string) => t.includes('Завершить'))).toBe(false);
    expect(btns.some((t: string) => t.includes('В архив'))).toBe(false);
  });

  test('view: несуществующий поток — ошибка', async () => {
    const response = await router.handleCallback(
      'stream:view-stream:view:ffffffff-ffff-ffff-ffff-ffffffffffff',
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  // ── S03: Программа потока ──

  test('program: показывает дерево проектов через tree-renderer', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:program:${ACTIVE_ID}`,
      guest.telegramId,
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
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b: any) => b.text) ?? [];
    expect(btns.some((t: string) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── S04: Детали ──

  test('details: показывает детали потока', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:details:${ENROLLMENT_ID}`,
      guest.telegramId,
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
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b: any) => b.text) ?? [];
    expect(btns.some((t: string) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── Сквозной сценарий ──

  test('сквозной: каталог → карточка → программа → назад', async () => {
    // 1. Открываем каталог
    const catalogResp = await router.handleCallback(
      'stream:catalog:list',
      guest.telegramId,
      session,
    );
    assertBotResponseValid(catalogResp);

    // 2. Находим enrollment-поток (🟡)
    const buttons = catalogResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const streamBtn = buttons.find((b: any) => b.text.includes('🟡'));
    expect(streamBtn).toBeDefined();

    // 3. Открываем карточку потока
    const viewResp = await router.handleCallback(
      streamBtn!.code,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(viewResp);
    expect(viewResp.sendMessage?.text).toContain('JS Core');

    // 4. Нажимаем «Программа курса»
    const viewButtons = viewResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const programBtn = viewButtons.find((b: any) =>
      b.text.includes('Программа курса'),
    );
    expect(programBtn).toBeDefined();

    // 5. Открываем программу
    const programResp = await router.handleCallback(
      programBtn!.code,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(programResp);
    expect(programResp.sendMessage?.text).toContain('Программа курса');

    // 6. Нажимаем «Назад к потоку»
    const progButtons = programResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const backBtn = progButtons.find((b: any) =>
      b.text.includes('Назад к потоку'),
    );
    expect(backBtn).toBeDefined();

    // 7. Возвращаемся в карточку
    const backResp = await router.handleCallback(
      backBtn!.code,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(backResp);
    expect(backResp.sendMessage?.text).toContain('JS Core');
  });

  // ── S05: Список студентов (публичный) ──

  test('students: кнопка «👥 Студенты» в карточке потока', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:view:${ACTIVE_ID}`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b: any) => b.text) ?? [];
    expect(btns.some((t: string) => t.includes('Студенты'))).toBe(true);
  });

  test('students: открывает список студентов с метриками', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:students:${ACTIVE_ID}`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Метрики группы');
    expect(text).not.toContain('Неизвестная команда');
  });

  test('students: кнопка студента ведёт в view-stream:student-detail (не monitor)', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:students:${ACTIVE_ID}`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const allCodes =
      response.sendMessage?.keyboard?.rows.flat().map((b: any) => b.code) ?? [];

    // Кнопки студентов должны использовать view-stream:student-detail (публичный)
    const studentDetailCodes = allCodes.filter((c) =>
      c.includes(':student-detail:'),
    );
    expect(studentDetailCodes.length).toBeGreaterThan(0);

    // НЕ должно быть monitor:detail:
    const monitorDetailCodes = allCodes.filter((c) =>
      c.startsWith('monitor:detail:'),
    );
    expect(monitorDetailCodes.length).toBe(0);
  });

  test('students: публичный режим НЕ содержит кнопок ⛔✅🔄', async () => {
    const response = await router.handleCallback(
      `stream:view-stream:students:${ACTIVE_ID}`,
      mentor.telegramId, // даже ментор в публичном каталоге не видит менторских кнопок
      session,
    );
    assertBotResponseValid(response);
    const allTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b: any) => b.text) ?? [];

    expect(allTexts).not.toContain('⛔');
    expect(allTexts).not.toContain('✅');
    expect(allTexts).not.toContain('🔄');
  });

  test('students: публичная карточка студента (student-detail)', async () => {
    // Сначала получаем список студентов
    const listResp = await router.handleCallback(
      `stream:view-stream:students:${ACTIVE_ID}`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(listResp);

    // Находим кнопку первого студента
    const studentBtn = listResp.sendMessage?.keyboard?.rows
      .flat()
      .find((b: any) => b.code.includes(':student-detail:'));
    expect(studentBtn).toBeDefined();

    // Открываем карточку студента
    const response = await router.handleCallback(
      studentBtn!.code,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    // Полная карточка: Прогресс студента, Усидчивость, Активность
    expect(text).toContain('Прогресс студента');
    expect(text).toContain('Усидчивость студента');
    expect(text).toContain('Активность студента');
    expect(text).not.toContain('Неизвестная команда');

    // Кнопка «Назад к списку»
    const backBtn = response.sendMessage?.keyboard?.rows
      .flat()
      .find((b: any) => b.text.includes('Назад к списку'));
    expect(backBtn).toBeDefined();
    expect(backBtn!.code).toContain(':students:');
  });
});
