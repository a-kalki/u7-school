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
import { assertBotResponseValid } from '@u7-scl/core/ui';
import type { TestApp } from '../helpers/test-app';
import { createTestApp } from '../helpers/test-app';
import {
  createTestBotTransport,
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
    const stream = await app.apiApp.execute('get-stream', {
      streamId: ENROLLMENT_ID,
    });
    expect((stream as { status: string }).status).toBe('enrollment');
    expect((stream as { mentorId: string }).mentorId).toBe(mentor.uuid);
  });

  test('active поток — статус active', async () => {
    const stream = await app.apiApp.execute('get-stream', {
      streamId: ACTIVE_ID,
    });
    expect((stream as { status: string }).status).toBe('active');
  });

  // ── Студенты ──

  test('список студентов enrollment-потока (пустой)', async () => {
    const students = await app.apiApp.execute(
      'list-stream-students',
      { streamId: ENROLLMENT_ID },
      mentor.uuid,
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

function findButton(
  response: {
    sendMessage?: {
      keyboard?: { rows: Array<Array<{ text: string; code: string }>> };
    };
  },
  textContains: string,
): { text: string; code: string } {
  const btn = response.sendMessage?.keyboard?.rows
    .flat()
    .find((b) => b.text.includes(textContains));
  if (!btn) {
    const allTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b) => b.text)
        .join(', ') ?? '(нет клавиатуры)';
    throw new Error(
      `Кнопка «${textContains}» не найдена. Доступны: ${allTexts}`,
    );
  }
  return btn;
}

/**
 * Интеграционный тест: полный wizard создания потока (S09).
 */
describe('CreateStream Wizard (интеграционный)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('create-stream-wizard');
    const mentorController = new MentorController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    transport = createTestBotTransport(app, [appController, mentorController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('полный wizard: все шаги → поток создан', async () => {
    // Шаг 0: Инструменты ментора → Создать поток
    const menu = await transport.collectMainMenu(mentor);
    const toolsBtn = menu.find((i) => i.text.includes('Инструменты ментора'));
    expect(toolsBtn).toBeDefined();

    const submenuResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: (toolsBtn as { action: string }).action,
      }),
    );
    assertBotResponseValid(submenuResp);

    const createBtn = findButton(submenuResp, 'Создать поток');

    // Шаг 0: список модулей
    const step0 = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: createBtn.code,
      }),
    );
    assertBotResponseValid(step0);

    expect(step0.sendMessage?.text).toContain('Выберите модуль');
    expect(step0.captureInput).toBeDefined();

    const moduleBtn = findButton(step0, 'JavaScript Основы');

    // Шаг 1: название (предзаполнено из модуля)
    const step1 = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: moduleBtn.code,
      }),
    );
    assertBotResponseValid(step1);

    expect(step1.sendMessage?.text).toContain('название потока');
    expect(step1.captureInput).toBeDefined();
    const ctx1 = step1.captureInput!.context as Record<string, unknown>;
    expect(ctx1.step).toBe(1);

    // Принимаем название
    const acceptTitleBtn = findButton(step1, 'Принять');
    const step2 = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: acceptTitleBtn.code,
      }),
    );
    assertBotResponseValid(step2);

    expect(step2.sendMessage?.text).toContain('описание потока');
    const ctx2 = step2.captureInput!.context as Record<string, unknown>;
    expect(ctx2.step).toBe(2);

    // Вводим описание
    const step3 = await transport.handleMessage(
      transport.makeBotContext(mentor.telegramId, {
        text: 'Тестовый поток (интеграция)',
      }),
    );
    assertBotResponseValid(step3!);

    expect(step3!.sendMessage?.text).toContain('дату старта');
    const ctx3 = step3!.captureInput!.context as Record<string, unknown>;
    expect(ctx3.step).toBe(3);
    expect(ctx3.description).toBe('Тестовый поток (интеграция)');

    // Вводим дату
    const step4 = await transport.handleMessage(
      transport.makeBotContext(mentor.telegramId, {
        text: '2026-06-15',
      }),
    );
    assertBotResponseValid(step4!);

    // После даты — первое необязательное поле (goal)
    expect(step4!.sendMessage?.text).toContain('Цель');
    const ctx4 = step4!.captureInput!.context as Record<string, unknown>;
    expect(ctx4.step).toBe(4);

    // Пропускаем все необязательные поля (goal, result, rules, targetAudience, additional)
    let currentResp = step4!;
    for (let i = 0; i < 5; i++) {
      const skipBtn = findButton(currentResp, 'Пропустить');
      currentResp = (await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: skipBtn.code,
        }),
      ))!;
      assertBotResponseValid(currentResp);
    }

    // После additional — шаг 9: группа
    expect(currentResp.sendMessage?.text).toContain('Telegram');

    // Пропускаем группу
    const skipGroupBtn = findButton(currentResp, 'Пропустить');
    currentResp = (await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: skipGroupBtn.code,
      }),
    ))!;
    assertBotResponseValid(currentResp);

    // Шаг 10: кодовое слово
    expect(currentResp.sendMessage?.text).toContain('кодовое слово');

    // Пропускаем кодовое слово
    const skipKeyBtn = findButton(currentResp, 'Пропустить');
    const previewResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: skipKeyBtn.code,
      }),
    );
    assertBotResponseValid(previewResp);

    // Шаг 11: подтверждение (превью)
    expect(previewResp.sendMessage?.text).toContain('Превью');
    const confirmBtn = findButton(previewResp, 'Создать');

    const finalResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: confirmBtn.code,
      }),
    );
    assertBotResponseValid(finalResp);

    // Поток создан — releaseInput
    expect(finalResp.releaseInput).toBe(true);
    expect(finalResp.sendMessage?.text).toContain('создан');
  });

  test('wizard: отмена создания потока через /cancel', async () => {
    // Начинаем создание
    const menu = await transport.collectMainMenu(mentor);
    const toolsBtn = menu.find((i) => i.text.includes('Инструменты ментора'));
    expect(toolsBtn).toBeDefined();

    const submenuResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: (toolsBtn as { action: string }).action,
      }),
    );
    assertBotResponseValid(submenuResp);

    const createBtn = findButton(submenuResp, 'Создать поток');

    const step0 = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: createBtn.code,
      }),
    );
    assertBotResponseValid(step0);
    expect(step0.captureInput).toBeDefined();

    // Отменяем
    const cancelResult = await transport.handleCancel(
      transport.makeBotContext(mentor.telegramId),
    );
    assertBotResponseValid(cancelResult!);

    expect(cancelResult!.sendMessage?.text).toContain('отменено');
    expect(cancelResult!.releaseInput).toBe(true);
  });
});
