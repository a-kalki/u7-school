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
 * Интеграционный тест S02-S04: карточка потока, программа, детали.
 *
 * Контракт «Диалог и Экран»: ассерты — по DialogResponse, захваченному
 * на границе uiApp. Коды прямых вызовов штампуются актуальным штампом
 * открытого экрана; нажатия по кнопкам с экрана — pressedCode.
 * Сжатие UUID и штампы проверяются по Api-записи («что увидел Telegram»).
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
    transport = createTestBotTransport(app, [appController, streamController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  /** Открывает диалог и вызывает сырой код view-stream с актуальным штампом. */
  async function openView(
    user: User,
    action: 'view' | 'program' | 'details' | 'students',
    streamId: string,
  ) {
    await transport.handleStart(transport.makeBotContext(user.telegramId));
    return transport.handleCallback(
      transport.makeBotContext(user.telegramId, {
        callbackData: stampedCode(
          transport,
          user.telegramId,
          `stream:view-stream:${action}:${streamId}`,
        ),
      }),
    );
  }

  // ── S02: Карточка потока ──

  test('view: показывает карточку enrollment-потока', async () => {
    const response = await openView(guest, 'view', ENROLLMENT_ID);
    const text = response.screen?.text ?? '';
    expect(text).toContain('JS Core');
    expect(text).toContain('Ментор');
    expect(text).toContain('📚 Курс');
    expect(text).not.toContain('Неизвестная команда');
  });

  test('view: кнопки Программа, Детали, Назад к списку', async () => {
    const response = await openView(guest, 'view', ENROLLMENT_ID);
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btns.some((t) => t.includes('Детали'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  test('view: нет менторских lifecycle-кнопок (гость)', async () => {
    const response = await openView(guest, 'view', ENROLLMENT_ID);
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btns.some((t) => t.includes('В архив'))).toBe(false);
  });

  test('view: нет менторских lifecycle-кнопок (ментор своего потока)', async () => {
    const response = await openView(mentor, 'view', ENROLLMENT_ID);
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btns.some((t) => t.includes('В архив'))).toBe(false);
  });

  test('view: несуществующий поток — ошибка', async () => {
    const response = await openView(
      guest,
      'view',
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
    );
    expect(response.screen?.text).toContain('не найден');
  });

  // ── S03: Программа потока ──

  test('program: показывает дерево проектов через tree-renderer', async () => {
    const response = await openView(guest, 'program', ACTIVE_ID);
    const text = response.screen?.text ?? '';
    expect(text).toContain('Программа курса');
    expect(text).toContain('📁');
    expect(text).toContain('📝');
  });

  test('program: кнопка «Назад к потоку»', async () => {
    const response = await openView(guest, 'program', ACTIVE_ID);
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── S04: Детали ──

  test('details: показывает детали потока', async () => {
    const response = await openView(guest, 'details', ENROLLMENT_ID);
    const text = response.screen?.text ?? '';
    expect(text).toContain('Детали');
    expect(text).toContain('JS Core');
  });

  test('details: кнопка «Назад к потоку»', async () => {
    const response = await openView(guest, 'details', ENROLLMENT_ID);
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── Сквозной сценарий ──

  test('сквозной: каталог → карточка → программа → назад', async () => {
    const tgId = guest.telegramId;
    await transport.handleStart(transport.makeBotContext(tgId));
    const press = (label: string) =>
      transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, label),
        }),
      );

    // 1. Каталог потоков
    const catalogResp = await press('Потоки курсов');
    expect(catalogResp.screen?.text).toContain('Потоки курсов');

    // 2-3. Enrollment-поток (🟡) → карточка
    const viewResp = await press('JS Core — Поток 1');
    expect(viewResp.screen?.text).toContain('JS Core');

    // 4-5. «Программа курса» → программа
    const programResp = await press('Программа курса');
    expect(programResp.screen?.text).toContain('Программа курса');

    // 6-7. «Назад к потоку» → карточка
    const backResp = await press('Назад к потоку');
    expect(backResp.screen?.text).toContain('JS Core');
  });

  test('сжатие UUID: кнопка потока сжимается и приходит обратно разжатой', async () => {
    const tgId = guest.telegramId;
    await transport.handleStart(transport.makeBotContext(tgId));
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Потоки курсов'),
      }),
    );

    // 1. Что ушло в Telegram: полный UUID не должен попасть в callback_data
    //    (Api-запись последнего экрана каталога)
    // (последняя Api-запись каталога С клавиатурой: retire-эдит клавиатуру
    // уже снял — текст тот же, кнопок нет)
    const catalogScreen = [...transport.api.editedMessages]
      .reverse()
      .concat([...transport.api.sentMessages].reverse())
      .filter((m) => m.telegramId === tgId)
      .find((m) => m.text.includes('Потоки курсов') && m.keyboard);
    expect(catalogScreen).toBeDefined();
    const streamBtn = catalogScreen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('JS Core — Поток 1'));
    expect(streamBtn).toBeDefined();
    expect(streamBtn!.code).not.toContain(ENROLLMENT_ID);
    expect(
      new TextEncoder().encode(streamBtn!.code).length,
    ).toBeLessThanOrEqual(64);

    // 2. Нажатие отштампованной сжатой кнопки возвращает полную карточку —
    //    разжатие UUID сработало
    const viewResp = await transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: streamBtn!.code }),
    );
    expect(viewResp.screen?.text).toContain('JS Core');
  });

  // ── S05: Список студентов (публичный) ──

  test('students: кнопка «👥 Студенты» в карточке потока', async () => {
    const response = await openView(guest, 'view', ACTIVE_ID);
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Студенты'))).toBe(true);
  });

  test('students: открывает список студентов с метриками', async () => {
    const response = await openView(guest, 'students', ACTIVE_ID);
    const text = response.screen?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Метрики группы');
    expect(text).not.toContain('Неизвестная команда');
  });

  test('students: кнопка студента ведёт в view-stream:student-detail (не monitor)', async () => {
    const response = await openView(guest, 'students', ACTIVE_ID);
    const allCodes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];

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
    const response = await openView(mentor, 'students', ACTIVE_ID);
    const allTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(allTexts).not.toContain('⛔');
    expect(allTexts).not.toContain('✅');
    expect(allTexts).not.toContain('🔄');
  });

  test('students: публичная карточка студента (student-detail)', async () => {
    // Список студентов
    const listResp = await openView(guest, 'students', ACTIVE_ID);

    // Кнопка первого студента (raw-код в DialogResponse)
    const studentBtn = listResp.screen?.keyboard?.rows
      .flat()
      .find((b) => b.code.includes(':student-detail:'));
    expect(studentBtn).toBeDefined();

    // Нажатие с актуальным штампом (та же стори — seq не менялся)
    const tgId = guest.telegramId;
    const response = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: stampedCode(transport, tgId, studentBtn!.code),
      }),
    );
    const text = response.screen?.text ?? '';
    // Полная карточка: Прогресс студента, Усидчивость, Активность
    expect(text).toContain('Прогресс студента');
    expect(text).toContain('Усидчивость студента');
    expect(text).toContain('Активность студента');
    expect(text).not.toContain('Неизвестная команда');

    // Кнопка «Назад к списку» ведёт в students
    const backBtn = response.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Назад к списку'));
    expect(backBtn).toBeDefined();
    expect(backBtn!.code).toContain(':students:');
  });

  // ── Запись с кодовым словом (enroll-key) ──

  test('enroll-key: гость вводит кодовое слово и записывается', async () => {
    const ENROLL_KEY_ID = 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4';

    // 1. Карточка потока с кодовым словом (Поток 5)
    const viewResp = await openView(guest, 'view', ENROLL_KEY_ID);
    expect(viewResp.screen?.text).toContain('Поток 5');

    // 2-3. «Записаться» → бот запрашивает кодовое слово (awaitInput)
    const tgId = guest.telegramId;
    const enrollResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Записаться'),
      }),
    );
    expect(enrollResp.screen?.text).toContain('кодовое слово');
    expect(enrollResp.awaitInput).toBeDefined();

    // 4. Верное кодовое слово — зачисление (notify-реплика + delegate в меню)
    const keyResp = await transport.handleMessage(
      transport.makeBotContext(tgId, { text: 'secret123' }),
    );
    const keyText = keyResp.notify?.text ?? '';
    expect(keyText).toContain('записаны');

    // Реплика содержит инструкцию по /start и кнопке «Моя учёба»
    expect(keyText).toContain('Теперь вы можете получить функционал по учёбе');

    // Без дубля: подписка хаба на student.enrolled удалена (трек user-notify) —
    // гостю не приходит отдельное «Ты зачислен…» поверх флоу-ответа
    const duplicates = transport.api.sentMessages.filter(
      (m) => m.telegramId === tgId && m.text.includes('зачислен'),
    );
    expect(duplicates).toHaveLength(0);
  });
});
