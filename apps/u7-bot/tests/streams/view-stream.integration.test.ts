import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { LearningController } from '@u7-scl/bot/learning/controller';
import { MentorController } from '@u7-scl/bot/mentor/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import { assertBotResponseValid } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

/**
 * Интеграционный тест S02-S04: карточка потока, программа, детали.
 *
 * Фикстурные ID:
 *   e0e0e0e0 — enrollment (🟡 JS Core, есть contentSnapshot)
 *   e1e1e1e1 — active     (🔵 JS Core 2, есть contentSnapshot)
 */
describe('ViewStreamStory (интеграционный)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let guest: User;
  let mentor: User;

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
  const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';
  const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

  beforeAll(async () => {
    app = await createTestApp('streams-view-int');
    const streamController = new StreamsController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    const learningController = new LearningController();
    const mentorController = new MentorController();
    transport = createTestBotTransport(app, [
      appController,
      streamController,
      learningController,
      mentorController,
    ]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── S02: Карточка потока ──

  test('view: показывает карточку enrollment-потока', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:view:${ENROLLMENT_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('JS Core');
    expect(text).toContain('Ментор');
    expect(text).toContain('📚 Курс');
    expect(text).not.toContain('Неизвестная команда');
  });

  test('view: кнопки Программа, Детали, Назад к списку', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:view:${ENROLLMENT_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btns.some((t) => t.includes('Детали'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  test('view: нет менторских lifecycle-кнопок (гость)', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:view:${ENROLLMENT_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btns.some((t) => t.includes('В архив'))).toBe(false);
  });

  test('view: нет менторских lifecycle-кнопок (ментор своего потока)', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: `stream:view-stream:view:${ENROLLMENT_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btns.some((t) => t.includes('В архив'))).toBe(false);
  });

  test('view: несуществующий поток — ошибка', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData:
          'stream:view-stream:view:ffffffff-ffff-ffff-ffff-ffffffffffff',
      }),
    );
    assertBotResponseValid(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  // ── S03: Программа потока ──

  test('program: показывает дерево проектов через tree-renderer', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:program:${ACTIVE_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Программа курса');
    expect(text).toContain('📁');
    expect(text).toContain('📝');
  });

  test('program: кнопка «Назад к потоку»', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:program:${ACTIVE_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── S04: Детали ──

  test('details: показывает детали потока', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:details:${ENROLLMENT_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Детали');
    expect(text).toContain('JS Core');
  });

  test('details: кнопка «Назад к потоку»', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:details:${ENROLLMENT_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── Сквозной сценарий ──

  test('сквозной: каталог → карточка → программа → назад', async () => {
    // 1. Открываем каталог
    const catalogResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: 'stream:catalog:list',
      }),
    );
    assertBotResponseValid(catalogResp);

    // 2. Находим enrollment-поток (🟡)
    const buttons = catalogResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const streamBtn = buttons.find((b) => b.text.includes('🟡'));
    expect(streamBtn).toBeDefined();

    // 3. Открываем карточку потока
    const viewResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: streamBtn!.code,
      }),
    );
    assertBotResponseValid(viewResp);
    expect(viewResp.sendMessage?.text).toContain('JS Core');

    // 4. Нажимаем «Программа курса»
    const viewButtons = viewResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const programBtn = viewButtons.find((b) =>
      b.text.includes('Программа курса'),
    );
    expect(programBtn).toBeDefined();

    // 5. Открываем программу
    const programResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: programBtn!.code,
      }),
    );
    assertBotResponseValid(programResp);
    expect(programResp.sendMessage?.text).toContain('Программа курса');

    // 6. Нажимаем «Назад к потоку»
    const progButtons = programResp.sendMessage?.keyboard?.rows.flat() ?? [];
    const backBtn = progButtons.find((b) => b.text.includes('Назад к потоку'));
    expect(backBtn).toBeDefined();

    // 7. Возвращаемся в карточку
    const backResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: backBtn!.code,
      }),
    );
    assertBotResponseValid(backResp);
    expect(backResp.sendMessage?.text).toContain('JS Core');
  });

  test('сжатие UUID: кнопка потока сжимается и приходит обратно разжатой', async () => {
    // 1. Каталог — кнопки с длинным UUID должны быть сжаты (≤ 64 байта)
    const catalogResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: 'stream:catalog:list',
      }),
    );
    assertBotResponseValid(catalogResp);

    const streamBtn = catalogResp.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('🟡'));
    expect(streamBtn).toBeDefined();

    // Полный UUID не должен попасть в callback_data
    expect(streamBtn!.code).not.toContain(ENROLLMENT_ID);
    expect(
      new TextEncoder().encode(streamBtn!.code).length,
    ).toBeLessThanOrEqual(64);

    // 2. Нажатие возвращает полную карточку — разжатие UUID сработало
    const viewResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: streamBtn!.code,
      }),
    );
    assertBotResponseValid(viewResp);
    expect(viewResp.sendMessage?.text).toContain('JS Core');
  });

  // ── S05: Список студентов (публичный) ──

  test('students: кнопка «👥 Студенты» в карточке потока', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:view:${ACTIVE_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Студенты'))).toBe(true);
  });

  test('students: открывает список студентов с метриками', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:students:${ACTIVE_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Метрики группы');
    expect(text).not.toContain('Неизвестная команда');
  });

  test('students: кнопка студента ведёт в view-stream:student-detail (не monitor)', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:students:${ACTIVE_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const allCodes =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];

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
    const response = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: `stream:view-stream:students:${ACTIVE_ID}`,
      }),
    );
    assertBotResponseValid(response);
    const allTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(allTexts).not.toContain('⛔');
    expect(allTexts).not.toContain('✅');
    expect(allTexts).not.toContain('🔄');
  });

  test('students: публичная карточка студента (student-detail)', async () => {
    // Сначала получаем список студентов
    const listResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:students:${ACTIVE_ID}`,
      }),
    );
    assertBotResponseValid(listResp);

    // Находим кнопку первого студента
    const studentBtn = listResp.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.code.includes(':student-detail:'));
    expect(studentBtn).toBeDefined();

    // Открываем карточку студента
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: studentBtn!.code,
      }),
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
      .find((b) => b.text.includes('Назад к списку'));
    expect(backBtn).toBeDefined();
    expect(backBtn!.code).toContain(':students:');
  });

  // ── Запись с кодовым словом (enroll-key) ──

  test('enroll-key: гость вводит кодовое слово и записывается', async () => {
    const ENROLL_KEY_ID = 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4';

    // 1. Открываем карточку потока с кодовым словом (Поток 5)
    const viewResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: `stream:view-stream:view:${ENROLL_KEY_ID}`,
      }),
    );
    assertBotResponseValid(viewResp);
    expect(viewResp.sendMessage?.text).toContain('Поток 5');

    // 2. Находим кнопку «Записаться»
    const enrollBtn = viewResp.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Записаться'));
    expect(enrollBtn).toBeDefined();

    // 3. Жмём «Записаться» — бот должен запросить кодовое слово
    const enrollResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: enrollBtn!.code,
      }),
    );
    assertBotResponseValid(enrollResp);
    expect(enrollResp.sendMessage?.text).toContain('кодовое слово');
    expect(enrollResp.captureInput).toBeDefined();

    // 4. Вводим верное кодовое слово — бот должен зачислить
    const keyResp = await transport.handleMessage(
      transport.makeBotContext(guest.telegramId, { text: 'secret123' }),
    );
    assertBotResponseValid(keyResp);
    expect(keyResp.sendMessage?.text).toContain('записаны');
  });
});
