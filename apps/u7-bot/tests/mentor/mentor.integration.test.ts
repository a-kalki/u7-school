import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { MentorController } from '@u7-scl/bot/mentor/controller';
import type { TestApp } from '../helpers/test-app';
import { createTestApp } from '../helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  screensNewFirst,
  type TestBotTransport,
} from '../helpers/test-bot-transport';

/**
 * Интеграционный тест: ментор → список потоков → карточка → студенты.
 *
 * Фикстурные ID:
 *   e0e0e0e0 — enrollment (ментор 4444...)
 *   e1e1e1e1 — active     (ментор 4444...)
 *   e2e2e2e2 — completed  (ментор 4444...)
 *   e3e3e3e3 — archived   (ментор 4444...)
 *   Ментор — telegramId 1004, uuid 4444...
 */
describe('MentorController (интеграционный)', () => {
  let app: TestApp;
  let mentor: User;

  const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';
  const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

  beforeAll(async () => {
    app = await createTestApp('mentor-int');
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Мои потоки ──

  test('ментор видит свои потоки (включая все 4 статуса)', async () => {
    const streams = await app.apiApp.execute('list-streams', {});
    const myStreams = (
      streams as Array<{ mentorId: string; status: string }>
    ).filter((s) => s.mentorId === mentor.uuid);
    expect(myStreams.length).toBeGreaterThanOrEqual(4);
    const statuses = new Set(myStreams.map((s) => s.status));
    expect(statuses.has('enrollment')).toBe(true);
    expect(statuses.has('active')).toBe(true);
    expect(statuses.has('completed')).toBe(true);
    expect(statuses.has('archived')).toBe(true);
  });

  // ── Карточка потока ──

  test('enrollment поток существует и доступен', async () => {
    const stream = await app.apiApp.execute(
      'get-stream',
      { streamId: ENROLLMENT_ID },
      mentor,
    );
    expect((stream as { status: string }).status).toBe('enrollment');
    expect((stream as { mentorId: string }).mentorId).toBe(mentor.uuid);
  });

  test('active поток — статус active', async () => {
    const stream = await app.apiApp.execute(
      'get-stream',
      { streamId: ACTIVE_ID },
      mentor,
    );
    expect((stream as { status: string }).status).toBe('active');
  });

  // ── Студенты ──

  test('список студентов enrollment-потока (пустой)', async () => {
    const students = await app.apiApp.execute(
      'list-stream-students',
      { streamId: ENROLLMENT_ID },
      mentor,
    );
    expect(Array.isArray(students)).toBe(true);
  });

  // ── Создание потока (wizard: модули) ──

  test('wizard: список модулей для создания потока', async () => {
    const modules = await app.apiApp.execute('list-modules', {});
    expect(Array.isArray(modules)).toBe(true);
  });
});

// ══ Хелперы для тестов wizard-а ══

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

/**
 * Интеграционный тест: полный wizard создания потока (S09).
 *
 * Контракт «Диалог и Экран»: коды кнопок берутся отштампованными
 * из Api-записи (pressedCode — как реальный клиент); шаги wizard-а —
 * экраны с awaitInput (контекст в dialog.input.context), реплики —
 * notify. Ответ захватывается на границе uiApp.
 */
describe('CreateStream Wizard (интеграционный)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let mentor: User;
  let tgId: number;

  beforeAll(async () => {
    app = await createTestApp('create-stream-wizard');
    const mentorController = new MentorController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    transport = createTestBotTransport(app, [appController, mentorController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    tgId = mentor.telegramId;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  /** Последний отправленный экран (send+edit по messageId). */
  function lastScreen() {
    const [screen] = screensNewFirst(transport, tgId);
    if (!screen) throw new Error(`Нет экранов у пользователя ${tgId}`);
    return screen;
  }

  test('полный wizard: все шаги → поток создан', async () => {
    // Шаг 0: Инструменты ментора → Создать поток
    await transport.handleStart(transport.makeBotContext(tgId));
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Инструменты ментора'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Создать поток'),
      }),
    );
    const step0 = lastScreen();
    expect(String(step0.text)).toContain('Выберите модуль');

    // Шаг 1: название (предзаполнено из модуля)
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'JavaScript Основы'),
      }),
    );
    const step1 = lastScreen();
    expect(String(step1.text)).toContain('название потока');

    // Принимаем название
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Принять'),
      }),
    );
    const step2 = lastScreen();
    expect(String(step2.text)).toContain('описание потока');

    // Вводим описание
    const step3 = await transport.handleMessage(
      transport.makeBotContext(tgId, { text: 'Тестовый поток (интеграция)' }),
    );
    expect(String(step3.screen?.text)).toContain('дату старта');

    // Вводим дату
    const step4 = await transport.handleMessage(
      transport.makeBotContext(tgId, { text: '2026-06-15' }),
    );

    // После даты — первое необязательное поле (goal)
    expect(String(step4.screen?.text)).toContain('Цель');

    // Пропускаем все необязательные поля (goal, result, rules, targetAudience, additional)
    for (let i = 0; i < 5; i++) {
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Пропустить'),
        }),
      );
    }
    expect(String(lastScreen().text)).toContain('Telegram');

    // Пропускаем группу
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Пропустить'),
      }),
    );
    // Шаг 10: инвайт-ссылка
    expect(String(lastScreen().text)).toContain('инвайт');

    // Пропускаем инвайт-ссылку
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Пропустить'),
      }),
    );
    // Шаг 11: кодовое слово
    expect(String(lastScreen().text)).toContain('кодовое слово');

    // Пропускаем кодовое слово → шаг 12: подтверждение (превью)
    const previewResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Пропустить'),
      }),
    );
    const preview = String(previewResp.screen?.text);
    expect(preview).toContain('Превью');

    // Поток создан — ввод освобождён
    const finalResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Создать'),
      }),
    );
    expect(finalResp.release).toBe(true);
    expect(String(finalResp.screen?.text)).toContain('создан');
  });

  test('wizard: ввод ID группы и инвайт-ссылки → оба поля сохранены в потоке', async () => {
    // Шаг 0: Инструменты ментора → Создать поток → модуль
    await transport.handleStart(transport.makeBotContext(tgId));
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Инструменты ментора'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Создать поток'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'JavaScript Основы'),
      }),
    );

    // Принимаем название
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Принять'),
      }),
    );

    // Шаг 2: описание
    await transport.handleMessage(
      transport.makeBotContext(tgId, { text: 'Тестовый поток (поля группы)' }),
    );

    // Шаг 3: дата
    await transport.handleMessage(
      transport.makeBotContext(tgId, { text: '2026-06-15' }),
    );

    // Шаги 4-8: пропускаем необязательные поля модуля
    for (let i = 0; i < 5; i++) {
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Пропустить'),
        }),
      );
    }

    // Шаг 9: вводим ID группы
    expect(String(lastScreen().text)).toContain('Telegram');
    await transport.handleMessage(
      transport.makeBotContext(tgId, { text: '-100987654321' }),
    );

    // Шаг 10: вводим инвайт-ссылку
    expect(String(lastScreen().text)).toContain('инвайт');
    await transport.handleMessage(
      transport.makeBotContext(tgId, { text: 'https://t.me/+testgroup' }),
    );

    // Шаг 11: пропускаем кодовое слово → превью
    expect(String(lastScreen().text)).toContain('кодовое слово');
    const previewResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Пропустить'),
      }),
    );
    const preview = String(previewResp.screen?.text);
    expect(preview).toContain('Превью');
    expect(preview).toContain('ID группы');
    expect(preview).toContain('Ссылка для студентов');

    const finalResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Создать'),
      }),
    );
    expect(finalResp.release).toBe(true);
    expect(String(finalResp.screen?.text)).toContain('создан');

    // Сквозная проверка: оба поля сохранены в правильных полях потока
    const streams = (await app.apiApp.execute('list-streams', {})) as Array<{
      description: string;
      telegramGroupId?: string;
      telegramGroupInvite?: string;
    }>;
    const created = streams.find(
      (s) => s.description === 'Тестовый поток (поля группы)',
    );
    expect(created).toBeDefined();
    expect(created!.telegramGroupId).toBe('-100987654321');
    expect(created!.telegramGroupInvite).toBe('https://t.me/+testgroup');
  });

  test('wizard: отмена создания потока через /cancel', async () => {
    // Начинаем создание
    await transport.handleStart(transport.makeBotContext(tgId));
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Инструменты ментора'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Создать поток'),
      }),
    );
    expect(String(lastScreen().text)).toContain('Выберите модуль');

    // Отменяем (/cancel — команда pipe: активная стори стопается)
    const cancelResult = await transport.handleCancel(
      transport.makeBotContext(tgId),
    );
    expect(cancelResult.notify?.text).toContain('отменено');
    expect(cancelResult.release).toBe(true);
  });
});
