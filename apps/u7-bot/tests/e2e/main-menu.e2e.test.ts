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
import { CoursesController } from '@u7-scl/bot/courses/controller';
import { LearningController } from '@u7-scl/bot/learning/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { DialogResponse } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

/**
 * Интеграционные тесты: главное меню, /start, /help (домен app — трек 1/2).
 * Сквозной путь: transport (штампы, сессии) → U7BotUiApp → контроллеры.
 *
 * Паттерн нажатий (контракт «Диалог и Экран»): коды кнопок берутся
 * отштампованными из Api-записи предыдущего экрана (:~seq36 — как реальный
 * клиент), а содержимое ответа ассертится по DialogResponse, захваченному
 * на границе uiApp (notify и screen разделены).
 */

/** Отштампованный код кнопки с последнего экрана пользователя (Api-запись). */
function pressedCode(
  transport: TestBotTransport,
  tgId: number,
  textContains: string,
): string {
  const screens = [
    ...transport.api.editedMessages,
    ...transport.api.sentMessages,
  ]
    .filter((m) => m.telegramId === tgId)
    .reverse();
  for (const screen of screens) {
    const btn = screen.keyboard?.rows
      .flat()
      .find((b) => b.text.includes(textContains));
    if (btn) return btn.code;
  }
  throw new Error(
    `Кнопка «${textContains}» не найдена на экранах ${tgId} ` +
      `(перед нажатием открой экран через /start или кнопку).`,
  );
}

describe('Главное меню (интеграционные)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let guest: User;
  let student: User;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('main-menu-int');
    const streamController = new StreamsController();
    const courseController = new CoursesController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    const learningController = new LearningController();
    transport = createTestBotTransport(app, [
      appController,
      streamController,
      courseController,
      learningController,
    ]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Кнопка «Сообщество школы» ──

  test('гость видит кнопку «Сообщество школы» в главном меню', async () => {
    const menu = await transport.collectMainMenu(guest);
    const btn = menu.find((i) => i.text === '💬 Сообщество школы');
    expect(btn).toBeDefined();
    expect(btn!.kind).toBe('url');
    expect((btn as { url: string }).url).toBe(SCHOOL_GROUP_URL);
    expect(btn!.priority).toBe(90);
  });

  test('студент видит кнопку «Сообщество школы»', async () => {
    const menu = await transport.collectMainMenu(student);
    expect(menu.some((i) => i.text === '💬 Сообщество школы')).toBe(true);
  });

  test('ментор видит кнопку «Сообщество школы»', async () => {
    const menu = await transport.collectMainMenu(mentor);
    expect(menu.some((i) => i.text === '💬 Сообщество школы')).toBe(true);
  });

  test('кнопка «Помощь» в конце меню (самый низкий приоритет)', async () => {
    const menu = await transport.collectMainMenu(guest);
    const last = menu[menu.length - 1]!;
    expect(last.text).toBe('❓ Помощь');
  });

  test('гость видит кнопку «Помощь» в главном меню', async () => {
    const menu = await transport.collectMainMenu(guest);
    const btn = menu.find((i) => i.text === '❓ Помощь');
    expect(btn).toBeDefined();
    expect(btn!.kind).toBe('callback');
    if (btn!.kind === 'callback') {
      expect(btn!.action).toBe('app:help');
    }
    expect(btn!.priority).toBe(100);
  });

  // ── /start: welcome-экран с клавиатурой меню ──

  test('/start возвращает приветствие с клавиатурой', async () => {
    const response = await transport.handleStart(
      transport.makeBotContext(guest.telegramId),
    );
    expect(response.screen?.text).toContain('Привет');
    expect(response.screen?.text).toContain('u7 schools');
    expect(response.screen?.text).toContain('Помощь');
    expect(response.screen?.keyboard).toBeDefined();
    expect(response.notify).toBeUndefined();
  });

  test('/start для ментора', async () => {
    const response = await transport.handleStart(
      transport.makeBotContext(mentor.telegramId),
    );
    expect(response.screen?.text).toContain('Привет');
    expect(response.screen?.keyboard).toBeDefined();
  });

  // ── /help: общий справочник — реплика без клавиатуры (ФР-5) ──

  test('/help возвращает инструкцию и описания menuButtons', async () => {
    const response = await transport.handleHelp(
      transport.makeBotContext(guest.telegramId),
    );
    const text = response.notify?.text ?? '';
    expect(text).toContain('Как со мной работать?');
    expect(text).toContain('Программы курсов');
    expect(text).toContain('Потоки курсов');
    expect(text).toContain('Сообщество школы');
    expect(text).toContain('/cancel');
    // Реплика не захватывает экран — клавиатуры у notify нет
    expect(response.screen).toBeUndefined();
  });

  test('/help для студента: список menuButtons (см. также трек learning)', async () => {
    const response = await transport.handleHelp(
      transport.makeBotContext(student.telegramId),
    );
    const text = response.notify?.text ?? '';
    // Справочник собирается из menuButtons актора: с трека learning
    // включён и пункт «🎓 Моя учёба» (см. describe learning ниже).
    expect(text).toContain('Программы курсов');
    expect(text).toContain('Потоки курсов');
    expect(text).toContain('Моя учёба');
  });

  // ── app:main-menu кнопкой (отштампованный код из Api-записи) ──

  test('app:main-menu из каталога возвращает короткое меню без приветствия', async () => {
    const tgId = guest.telegramId;
    await transport.handleStart(transport.makeBotContext(tgId));
    // Реальный путь: меню → каталог потоков → «↩️ Главное меню»
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Потоки курсов'),
      }),
    );
    const response = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Главное меню'),
      }),
    );

    expect(String(response.screen?.text)).toBe('Выберите действие:');
    expect(response.screen?.text).not.toContain('Привет');
    expect(response.screen?.keyboard).toBeDefined();
  });

  // ── app:help кнопкой ──

  test('app:help возвращает инструкцию (реплика, без экрана)', async () => {
    const tgId = guest.telegramId;
    await transport.handleStart(transport.makeBotContext(tgId));
    const response = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Помощь'),
      }),
    );

    expect(response.notify?.text).toContain('Как со мной работать?');
    expect(response.screen).toBeUndefined();
  });

  // ── Сырой код без штампа transport не пропускает (ФР-3, И2) ──

  test('нажатие сырым кодом (без штампа) не доезжает до uiApp', async () => {
    const tgId = guest.telegramId;
    await transport.handleStart(transport.makeBotContext(tgId));
    const before = transport.api.sentMessages.length;
    const response = await transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: 'app:main-menu' }),
    );

    // Пустой ответ (alert «экран устарел») — и ничего не отрендерено
    expect(response).toEqual({});
    expect(transport.api.sentMessages.length).toBe(before);
  });

  // ── В главном меню нет кнопки «Назад» ──

  test('в главном меню нет кнопки «Назад» (guest)', async () => {
    const menu = await transport.collectMainMenu(guest);
    expect(menu.some((i) => i.text.includes('Назад'))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// E2E домена learning — контракт «Диалог и Экран» (мигрировано треком
// bot-ui-dialog-learning_20260905): отштампованные коды кнопок из
// Api-записей, ассерты — по DialogResponse (screen).
// ══════════════════════════════════════════════════════════════════

describe('E2E: Студент — «Моя учёба» (learning)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let student: User;

  beforeAll(async () => {
    app = await createTestApp('student-my-study-e2e');
    const streamController = new StreamsController();
    const learningController = new LearningController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    transport = createTestBotTransport(app, [
      appController,
      streamController,
      learningController,
    ]);
    student = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  /** Открывает хаб студента: /start → «🎓 Моя учёба». */
  async function openHub(): Promise<DialogResponse> {
    await transport.handleStart(transport.makeBotContext(student.telegramId));
    return transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: pressedCode(transport, student.telegramId, 'Моя учёба'),
      }),
    );
  }

  test('студент: главное меню → Моя учёба → хаб', async () => {
    const hubResp = await openHub();
    expect(String(hubResp.screen?.text)).toContain('Моя учёба');

    const btns = hubResp.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Начать учёбу'))).toBe(true);
    expect(btns.some((t) => t.includes('Уроки'))).toBe(true);
    expect(btns.some((t) => t.includes('Мой прогресс'))).toBe(true);
    expect(btns.some((t) => t.includes('Покинуть учёбу'))).toBe(true);
  });

  test('студент: хаб → Начать учёбу → просмотр шага → Выполнено', async () => {
    const tgId = student.telegramId;
    const hubResp = await openHub();

    // 2. Нажимаем «▶️ Начать учёбу»
    const stepResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Начать учёбу'),
      }),
    );
    expect(String(stepResp.screen?.text)).toContain('JS Core');
    expect(String(stepResp.screen?.text)).toContain('Шаг 1');

    // 3. Нажимаем «✅ Выполнено»
    const completeResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Выполнено'),
      }),
    );
    // После выполнения — либо следующий шаг, либо завершение урока
    const text = String(completeResp.screen?.text);
    expect(
      text.includes('Шаг 2') ||
        text.includes('завершён') ||
        text.includes('Поток полностью завершён'),
    ).toBe(true);
  });

  test('студент: хаб → Уроки → проект → урок → шаги', async () => {
    const tgId = student.telegramId;
    const hubResp = await openHub();

    // 2. Нажимаем «📂 Уроки»
    const projectsResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Уроки'),
      }),
    );
    expect(String(projectsResp.screen?.text)).toContain('Введение');

    // 3. Нажимаем проект «Введение»
    const lessonsListResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Введение'),
      }),
    );
    expect(String(lessonsListResp.screen?.text)).toContain('Переменные и типы');

    // 4. Нажимаем урок «Переменные и типы»
    const stepsResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Переменные и типы'),
      }),
    );
    expect(String(stepsResp.screen?.text)).toContain(
      'знакомство с переменными',
    );
  });

  test('студент: хаб → Мой прогресс → детализация проектов и уроков', async () => {
    const tgId = student.telegramId;
    const hubResp = await openHub();

    // 2. Нажимаем «📊 Мой прогресс»
    const progressResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Мой прогресс'),
      }),
    );

    const text = String(progressResp.screen?.text);
    // Заголовок
    expect(text).toContain('Мой прогресс');
    // Общий прогресс
    expect(text).toContain('Общий:');
    // Проекты
    expect(text).toContain('Введение');
    // Уроки с индикаторами статуса (✅/▶️/🔒)
    expect(text).toContain('Переменные и типы');
    // Счётчик шагов
    expect(text).toContain('Всего шагов завершено');
    // Кнопка «Главное меню»
    const menuBtn = progressResp.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Главное меню'));
    expect(menuBtn).toBeDefined();
  });

  test('студент: хаб → Мой прогресс → назад к учёбе', async () => {
    const tgId = student.telegramId;
    await openHub();

    const progressResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Мой прогресс'),
      }),
    );

    // 2. «Назад к учёбе» → возврат в хаб
    const backResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Назад к учёбе'),
      }),
    );
    expect(String(backResp.screen?.text)).toContain('Моя учёба');
  });
});
