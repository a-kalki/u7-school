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
import { MentorController } from '@u7-scl/bot/mentor/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { CbMainMenuAction } from '@u7-scl/bot/u7-menu';
import { assertBotResponseValid, type BotResponse } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

function findButton(
  response: BotResponse,
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

function findMenuItem(
  items: CbMainMenuAction[],
  textContains: string,
): { text: string; action: string } {
  const item = items.find((i) => i.text.includes(textContains));
  if (!item) {
    const all = items.map((i) => i.text).join(', ');
    throw new Error(`Пункт меню «${textContains}» не найден. Доступны: ${all}`);
  }
  return item;
}

describe('E2E: Витрина для любопытного', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let guest: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-curious');
    const streamController = new StreamsController();
    const courseController = new CoursesController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    const learningController = new LearningController();
    const mentorController = new MentorController();
    transport = createTestBotTransport(app, [
      appController,
      streamController,
      courseController,
      learningController,
      mentorController,
    ]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Главное меню ──
  describe('Главное меню гостя', () => {
    test('содержит «📖 Программы курсов» и «📚 Потоки курсов»', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      expect(courseBtn.action).toStartWith('course:');
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      expect(streamBtn.action).toStartWith('stream:');
      expect(menu.some((i) => i.text.includes('Моя учёба'))).toBe(false);
      expect(menu.some((i) => i.text.includes('Создать поток'))).toBe(false);
    });
  });

  // ── «Программы курсов»: 5-уровневый drill-down ──
  describe('«Программы курсов» — drill-down', () => {
    test('уровень 0: курсы + этапы inline', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const response = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );
      assertBotResponseValid(response);
      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Курсы');
      expect(text).toContain('Основы программирования');
      expect(text).toContain('Синтаксис');
      expect(text).toContain('Алгоритмика');
      const btns =
        response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Основы'))).toBe(true);
      expect(btns.some((t) => t.includes('↩️ Главное меню'))).toBe(true);
    });

    test('уровень 1: клик на курс → этапы + модули inline', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseButton.code,
        }),
      );
      assertBotResponseValid(phasesResp);
      const text = phasesResp.sendMessage?.text ?? '';
      expect(text).toContain('Курс: Основы программирования');
      expect(text).toContain('Синтаксис');
      expect(text).toContain('JavaScript Основы');
      const btns =
        phasesResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Синтаксис'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к курсам'))).toBe(true);
    });

    test('уровень 2: клик на этап → модули + проекты inline', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseButton.code,
        }),
      );
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: phaseBtn.code,
        }),
      );
      assertBotResponseValid(modulesResp);
      const text = modulesResp.sendMessage?.text ?? '';
      expect(text).toContain('Этап: Синтаксис');
      expect(text).toContain('JavaScript Основы');
      expect(text).toContain('Введение');
      const btns =
        modulesResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('JavaScript'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к курсу'))).toBe(true);
    });

    test('уровень 3: клик на модуль → проекты + уроки inline', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseButton.code,
        }),
      );
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: phaseBtn.code,
        }),
      );
      const moduleBtn = findButton(modulesResp, 'JavaScript');
      const projectsResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: moduleBtn.code,
        }),
      );
      assertBotResponseValid(projectsResp);
      const text = projectsResp.sendMessage?.text ?? '';
      expect(text).toContain('Введение');
      expect(text).toContain('Переменные и типы');
      expect(text).toContain('Циклы и функции');
      const btns =
        projectsResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ??
        [];
      expect(btns.some((t) => t.includes('Введение'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к этапу'))).toBe(true);
    });

    test('уровень 4: клик на проект → уроки + шаги inline', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseButton.code,
        }),
      );
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: phaseBtn.code,
        }),
      );
      const moduleBtn = findButton(modulesResp, 'JavaScript');
      const projectsResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: moduleBtn.code,
        }),
      );
      const projectBtn = findButton(projectsResp, 'Введение');
      const lessonsResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: projectBtn.code,
        }),
      );
      assertBotResponseValid(lessonsResp);
      const text = lessonsResp.sendMessage?.text ?? '';
      expect(text).toContain('Проект: Введение');
      expect(text).toContain('Переменные и типы');
      expect(text).not.toContain('```');
      expect(text).not.toContain('function');
      const btns =
        lessonsResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Назад к модулю'))).toBe(true);
    });
  });

  // ── «Потоки курсов»: curious-режим карточки потока ──
  describe('«Потоки курсов» — curious-режим карточки потока', () => {
    test('гость открывает каталог потоков (S01)', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const response = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: streamBtn.action,
        }),
      );
      assertBotResponseValid(response);
      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Потоки курсов');
      const btns =
        response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('🟡') || t.includes('🔵'))).toBe(true);
      expect(btns.some((t) => t.includes('↩️ Главное меню'))).toBe(true);
    });

    test('гость → enrollment-поток: карточка без менторских кнопок (S02)', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: streamBtn.action,
        }),
      );
      const streamButton = findButton(catalogResp, '🟡');
      const viewResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: streamButton.code,
        }),
      );
      assertBotResponseValid(viewResp);
      const text = viewResp.sendMessage?.text ?? '';
      expect(text).toContain('JS Core');
      expect(text).toContain('Ментор');
      expect(text).toContain('📚 Курс');
      expect(text).not.toContain('Неизвестная команда');
      const btns =
        viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btns.some((t) => t.includes('Детали'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);
      // Менторские lifecycle-кнопки отсутствуют
      expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
      expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
      expect(btns.some((t) => t.includes('В архив'))).toBe(false);
      expect(btns.some((t) => t.includes('Записаться'))).toBe(true);
      // Кнопка «👥 Студенты» доступна (Трек 6)
      expect(btns.some((t) => t.includes('Студенты'))).toBe(true);

      // Проверяем, что нажатие на «Студенты» работает (кросс-контроллерный callback)
      const studentsBtn = findButton(viewResp, 'Студенты');
      const studentsResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: studentsBtn.code,
        }),
      );
      assertBotResponseValid(studentsResp);
      const studentsText = studentsResp.sendMessage?.text ?? '';
      expect(studentsText).not.toContain('Неизвестная команда');
      expect(studentsText).toContain('Студенты потока');
      expect(studentsText).toContain('Всего:');
    });

    test('гость → active-поток: Программа и Детали видны (S02)', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: streamBtn.action,
        }),
      );
      const activeButton = findButton(catalogResp, '🔵');
      const viewResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: activeButton.code,
        }),
      );
      assertBotResponseValid(viewResp);
      const btns =
        viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btns.some((t) => t.includes('Детали'))).toBe(true);
    });
  });

  // ── «Программы курсов» — drill-up (обратная навигация) ──
  describe('«Программы курсов» — обратная навигация', () => {
    test('drill-down 5 уровней → drill-up 4 уровня обратно', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');

      const l0 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );
      const l1 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(l0, 'Основы').code,
        }),
      );
      const l2 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(l1, 'Синтаксис').code,
        }),
      );
      const l3 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(l2, 'JavaScript').code,
        }),
      );
      const l4 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(l3, 'Введение').code,
        }),
      );

      assertBotResponseValid(l4);
      expect(l4.sendMessage?.text).toContain('Проект: Введение');

      // Назад: 4 → 3
      const back43 = findButton(l4, 'Назад к модулю');
      const back3 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: back43.code,
        }),
      );
      assertBotResponseValid(back3);
      expect(back3.sendMessage?.text).toContain('Модуль: JavaScript');

      // Назад: 3 → 2
      const back32 = findButton(back3, 'Назад к этапу');
      const back2 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: back32.code,
        }),
      );
      assertBotResponseValid(back2);
      expect(back2.sendMessage?.text).toContain('Синтаксис');

      // Назад: 2 → 1
      const back21 = findButton(back2, 'Назад к курсу');
      const back1 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: back21.code,
        }),
      );
      assertBotResponseValid(back1);
      expect(back1.sendMessage?.text).toContain(
        'Курс: Основы программирования',
      );

      // Назад: 1 → 0
      const back10 = findButton(back1, 'Назад к курсам');
      const back0 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: back10.code,
        }),
      );
      assertBotResponseValid(back0);
      expect(back0.sendMessage?.text).toContain('Курсы');
    });

    test('drill-down → назад → другой путь', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');

      const l0 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );
      const l1 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(l0, 'Основы').code,
        }),
      );
      const l2 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(l1, 'Синтаксис').code,
        }),
      );
      expect(l2.sendMessage?.text).toContain('Синтаксис');

      const back1 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(l2, 'Назад к курсу').code,
        }),
      );

      const algoBtn = findButton(back1, 'Алгоритмика');
      const algoResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: algoBtn.code,
        }),
      );
      assertBotResponseValid(algoResp);
      expect(algoResp.sendMessage?.text).toContain('Алгоритмика');
    });

    test('c карточки курса — Главное меню', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const l0 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );

      const mainMenuBtn = findButton(l0, 'Главное меню');
      const mainResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: mainMenuBtn.code,
        }),
      );
      assertBotResponseValid(mainResp);
      expect(mainResp.sendMessage?.text).toContain('Выберите действие');
    });
  });

  // ── «Потоки курсов» — полный round-trip ──
  describe('«Потоки курсов» — round-trip навигация', () => {
    test('каталог → карточка → программа → назад → детали → назад → каталог', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');

      const catalog = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: streamBtn.action,
        }),
      );
      assertBotResponseValid(catalog);

      const card = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(catalog, '🟡').code,
        }),
      );
      assertBotResponseValid(card);
      expect(card.sendMessage?.text).toContain('JS Core');

      const program = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(card, 'Программа курса').code,
        }),
      );
      assertBotResponseValid(program);
      expect(program.sendMessage?.text).toContain('Программа курса');
      expect(program.sendMessage?.text).toContain('📁');

      const backToCard = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(program, 'Назад к потоку').code,
        }),
      );
      assertBotResponseValid(backToCard);
      expect(backToCard.sendMessage?.text).toContain('JS Core');

      const details = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(backToCard, 'Детали').code,
        }),
      );
      assertBotResponseValid(details);
      expect(details.sendMessage?.text).toContain('Детали');

      const backAgain = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(details, 'Назад к потоку').code,
        }),
      );
      assertBotResponseValid(backAgain);
      expect(backAgain.sendMessage?.text).toContain('JS Core');

      const backToCatalog = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(backAgain, 'Назад к списку').code,
        }),
      );
      assertBotResponseValid(backToCatalog);
      expect(backToCatalog.sendMessage?.text).toContain('Потоки курсов');
    });

    test('каталог → active-поток → программа → назад → каталог', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');

      const catalog = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: streamBtn.action,
        }),
      );
      const card = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(catalog, '🔵').code,
        }),
      );
      assertBotResponseValid(card);
      expect(card.sendMessage?.text).toContain('Поток 2');

      const program = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(card, 'Программа курса').code,
        }),
      );
      assertBotResponseValid(program);
      expect(program.sendMessage?.text).toContain('📁');

      const back1 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(program, 'Назад к потоку').code,
        }),
      );
      const backCatalog = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(back1, 'Назад к списку').code,
        }),
      );
      expect(backCatalog.sendMessage?.text).toContain('Потоки курсов');
    });

    test('каталог → Главное меню', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalog = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: streamBtn.action,
        }),
      );

      const mainMenuBtn = findButton(catalog, 'Главное меню');
      const mainResp = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: mainMenuBtn.code,
        }),
      );
      assertBotResponseValid(mainResp);
      expect(mainResp.sendMessage?.text).toContain('Выберите действие');
    });

    test('несуществующий поток — ошибка', async () => {
      const response = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData:
            'stream:view-stream:view:ffffffff-ffff-ffff-ffff-ffffffffffff',
        }),
      );
      assertBotResponseValid(response);
      expect(response.sendMessage?.text).toContain('не найден');
    });
  });

  // ── Сквозной: курсы ↔ потоки ──
  describe('Сквозная навигация: курсы ↔ потоки', () => {
    test('главное меню → курсы → назад → потоки → карточка → назад', async () => {
      const menu = (await transport.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];

      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const courses = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: courseBtn.action,
        }),
      );
      expect(courses.sendMessage?.text).toContain('Курсы');

      const main1 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(courses, 'Главное меню').code,
        }),
      );
      expect(main1.sendMessage?.text).toContain('Выберите действие');

      const streamBtn = findMenuItem(
        (await transport.collectMainMenu(guest)) as CbMainMenuAction[],
        'Потоки курсов',
      );
      const catalog = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: streamBtn.action,
        }),
      );
      expect(catalog.sendMessage?.text).toContain('Потоки курсов');

      const card = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(catalog, '🟡').code,
        }),
      );
      expect(card.sendMessage?.text).toContain('JS Core');

      const main2 = await transport.handleCallback(
        transport.makeBotContext(guest.telegramId, {
          callbackData: findButton(card, 'Назад к списку').code,
        }),
      );
      expect(main2.sendMessage?.text).toContain('Потоки курсов');
    });

    test('handleHelp показывает описания курсов и потоков', async () => {
      const response = await transport.handleHelp(
        transport.makeBotContext(guest.telegramId),
      );
      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Как со мной работать');
      expect(text).toContain('Программы курсов');
      expect(text).toContain('Потоки курсов');
    });
  });
});
