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
import type { BotResponse } from '@u7-scl/core/ui';
import { assertBotResponseValid } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

/**
 * Интеграционные тесты: главное меню, /start, /help.
 * Проверяет сквозное взаимодействие AppController → UiApp → контроллеры.
 */
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

  // ── Кнопка «Помощь» ──

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

  // ── handleWelcome (/start) ──

  test('handleWelcome возвращает приветствие с клавиатурой', async () => {
    const response = await transport.handleStart(
      transport.makeBotContext(guest.telegramId),
    );
    expect(response.sendMessage?.text).toContain('Привет');
    expect(response.sendMessage?.text).toContain('u7 schools');
    expect(response.sendMessage?.text).toContain('Помощь');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleWelcome для ментора', async () => {
    const response = await transport.handleStart(
      transport.makeBotContext(mentor.telegramId),
    );
    expect(response.sendMessage?.text).toContain('Привет');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  // ── handleHelp (/help) ──

  test('handleHelp возвращает инструкцию и описания + кнопку Назад', async () => {
    const response = await transport.handleHelp(
      transport.makeBotContext(guest.telegramId),
    );
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Как со мной работать?');
    expect(text).toContain('Программы курсов');
    expect(text).toContain('Потоки курсов');
    expect(text).toContain('Сообщество школы');
    expect(text).toContain('/cancel');
    // Кнопка «Назад»
    expect(response.sendMessage?.keyboard).toBeDefined();
    expect(response.sendMessage?.keyboard!.rows[0]![0]!.text).toBe('🔙 Назад');
    expect(response.sendMessage?.keyboard!.rows[0]![0]!.code).toBe(
      'app:main-menu',
    );
  });

  test('handleHelp для студента: «Моя учёба»', async () => {
    const response = await transport.handleHelp(
      transport.makeBotContext(student.telegramId),
    );
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  // ── app:main-menu через handleCallback ──

  test('app:main-menu возвращает клавиатуру без приветствия', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: 'app:main-menu',
      }),
    );

    expect(response.sendMessage?.text).toBe('Выберите действие:');
    expect(response.sendMessage?.text).not.toContain('Привет');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  // ── app:help через handleCallback ──

  test('app:help возвращает инструкцию + кнопку Назад', async () => {
    const response = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: 'app:help',
      }),
    );

    expect(response.sendMessage?.text).toContain('Как со мной работать?');
    expect(response.sendMessage?.keyboard).toBeDefined();
    expect(response.sendMessage?.keyboard!.rows[0]![0]!.text).toBe('🔙 Назад');
  });

  // ── В главном меню нет кнопки «Назад» ──

  test('в главном меню нет кнопки «Назад» (guest)', async () => {
    const menu = await transport.collectMainMenu(guest);
    expect(menu.some((i) => i.text.includes('Назад'))).toBe(false);
  });
});

// ── E2E: Путь студента «Моя учёба» ──

describe('E2E: Студент — «Моя учёба»', () => {
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

  /** Находит кнопку в ответе по вхождению подстроки в текст. */
  function findButton(
    response: BotResponse,
    textContains: string,
  ): { text: string; code: string } {
    const btn = response.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes(textContains));
    if (!btn) {
      const all =
        response.sendMessage?.keyboard?.rows
          .flat()
          .map((b) => b.text)
          .join(', ') ?? '(нет клавиатуры)';
      throw new Error(`Кнопка «${textContains}» не найдена. Доступны: ${all}`);
    }
    return btn;
  }

  test('студент: главное меню → Моя учёба → хаб', async () => {
    // 1. Получаем главное меню студента
    const menu = await transport.collectMainMenu(student);
    const studyBtn = menu.find((i) => i.text.includes('Моя учёба'));
    expect(studyBtn).toBeDefined();

    // 2. Нажимаем «🎓 Моя учёба»
    const hubResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: (studyBtn as { action: string }).action,
      }),
    );
    assertBotResponseValid(hubResp);
    expect(hubResp.sendMessage?.text).toContain('Моя учёба');

    // 3. Проверяем кнопки хаба
    const btns =
      hubResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Начать учёбу'))).toBe(true);
    expect(btns.some((t) => t.includes('Уроки'))).toBe(true);
    expect(btns.some((t) => t.includes('Мой прогресс'))).toBe(true);
  });

  test('студент: хаб → Начать учёбу → просмотр шага → Выполнено', async () => {
    // 1. Открываем хаб
    const menu = await transport.collectMainMenu(student);
    const studyBtn = menu.find((i) => i.text.includes('Моя учёба')) as {
      action: string;
    };
    const hubResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: studyBtn.action,
      }),
    );
    assertBotResponseValid(hubResp);

    // 2. Нажимаем «▶️ Начать учёбу»
    const startBtn = findButton(hubResp, 'Начать учёбу');
    const stepResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: startBtn.code,
      }),
    );
    assertBotResponseValid(stepResp);
    expect(stepResp.sendMessage?.text).toContain('JS Core');
    expect(stepResp.sendMessage?.text).toContain('Шаг 1');

    // 3. Нажимаем «✅ Выполнено»
    const doneBtn = findButton(stepResp, 'Выполнено');
    const completeResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: doneBtn.code,
      }),
    );
    assertBotResponseValid(completeResp);
    // После выполнения — либо следующий шаг, либо завершение урока
    const text = completeResp.sendMessage?.text ?? '';
    expect(
      text.includes('Шаг 2') ||
        text.includes('завершён') ||
        text.includes('Поток полностью завершён'),
    ).toBe(true);
  });

  test('студент: хаб → Уроки → проект → урок → шаги', async () => {
    // 1. Открываем хаб
    const menu = await transport.collectMainMenu(student);
    const studyBtn = menu.find((i) => i.text.includes('Моя учёба')) as {
      action: string;
    };
    const hubResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: studyBtn.action,
      }),
    );
    assertBotResponseValid(hubResp);

    // 2. Нажимаем «📂 Уроки»
    const lessonsBtn = findButton(hubResp, 'Уроки');
    const projectsResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: lessonsBtn.code,
      }),
    );
    assertBotResponseValid(projectsResp);
    expect(projectsResp.sendMessage?.text).toContain('Введение');

    // 3. Нажимаем проект «Введение»
    const projectBtn = findButton(projectsResp, 'Введение');
    const lessonsListResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: projectBtn.code,
      }),
    );
    assertBotResponseValid(lessonsListResp);
    expect(lessonsListResp.sendMessage?.text).toContain('Переменные и типы');

    // 4. Нажимаем урок «Переменные и типы»
    const lessonBtn = findButton(lessonsListResp, 'Переменные и типы');
    const stepsResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: lessonBtn.code,
      }),
    );
    assertBotResponseValid(stepsResp);
    expect(stepsResp.sendMessage?.text).toContain('знакомство с переменными');
  });

  test('студент: хаб → Мой прогресс → детализация проектов и уроков', async () => {
    // 1. Открываем хаб
    const menu = await transport.collectMainMenu(student);
    const studyBtn = menu.find((i) => i.text.includes('Моя учёба')) as {
      action: string;
    };
    const hubResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: studyBtn.action,
      }),
    );
    assertBotResponseValid(hubResp);

    // 2. Нажимаем «📊 Мой прогресс»
    const progressBtn = findButton(hubResp, 'Мой прогресс');
    const progressResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: progressBtn.code,
      }),
    );
    assertBotResponseValid(progressResp);

    const text = progressResp.sendMessage?.text ?? '';
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
    // Кнопка «Назад к учёбе»
    const backBtn = findButton(progressResp, 'Назад к учёбе');
    expect(backBtn.code).toContain('hub:my-study');
    // Кнопка «Главное меню»
    const menuBtn = progressResp.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Главное меню'));
    expect(menuBtn).toBeDefined();
  });

  test('студент: хаб → Мой прогресс → назад к учёбе', async () => {
    // 1. Открываем хаб → прогресс
    const menu = await transport.collectMainMenu(student);
    const studyBtn = menu.find((i) => i.text.includes('Моя учёба')) as {
      action: string;
    };
    const hubResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: studyBtn.action,
      }),
    );
    const progressBtn = findButton(hubResp, 'Мой прогресс');
    const progressResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: progressBtn.code,
      }),
    );

    // 2. «Назад к учёбе» → возврат в хаб
    const backBtn = findButton(progressResp, 'Назад к учёбе');
    const backResp = await transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: backBtn.code,
      }),
    );
    assertBotResponseValid(backResp);
    expect(backResp.sendMessage?.text).toContain('Моя учёба');
  });
});
