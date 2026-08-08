import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { CoursesController } from '@u7-scl/bot/courses/controller';
import { LearningController } from '@u7-scl/bot/learning/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type {
  BotResponse,
  CbMainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

const NO_SESSION: SessionData = { activeHandler: null };

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
  let router: UiApp;
  let guest: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-curious');
    const streamController = new StreamsController();
    const courseController = new CoursesController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    const learningController = new LearningController();
    router = new UiApp([
      appController,
      streamController,
      courseController,
      learningController,
    ]);
    router.init(app.apiApp);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Главное меню ──
  describe('Главное меню гостя', () => {
    test('содержит «📖 Программы курсов» и «📚 Потоки курсов»', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
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
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const response = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
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
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await router.handleCallback(
        courseButton.code,
        guest,
        NO_SESSION,
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
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await router.handleCallback(
        courseButton.code,
        guest,
        NO_SESSION,
      );
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await router.handleCallback(
        phaseBtn.code,
        guest,
        NO_SESSION,
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
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await router.handleCallback(
        courseButton.code,
        guest,
        NO_SESSION,
      );
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await router.handleCallback(
        phaseBtn.code,
        guest,
        NO_SESSION,
      );
      const moduleBtn = findButton(modulesResp, 'JavaScript');
      const projectsResp = await router.handleCallback(
        moduleBtn.code,
        guest,
        NO_SESSION,
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
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await router.handleCallback(
        courseButton.code,
        guest,
        NO_SESSION,
      );
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await router.handleCallback(
        phaseBtn.code,
        guest,
        NO_SESSION,
      );
      const moduleBtn = findButton(modulesResp, 'JavaScript');
      const projectsResp = await router.handleCallback(
        moduleBtn.code,
        guest,
        NO_SESSION,
      );
      const projectBtn = findButton(projectsResp, 'Введение');
      const lessonsResp = await router.handleCallback(
        projectBtn.code,
        guest,
        NO_SESSION,
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

  // ── «Потоки курсов»: curious-режим (S01-S04) ──
  describe('«Потоки курсов» — curious-режим карточки потока', () => {
    test('гость открывает каталог потоков (S01)', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const response = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
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
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );
      const streamButton = findButton(catalogResp, '🟡');
      const viewResp = await router.handleCallback(
        streamButton.code,
        guest,
        NO_SESSION,
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
      // Кнопка «👥 Студенты» теперь доступна через getAction<MonitorActions> (Трек 6)
      expect(btns.some((t) => t.includes('Студенты'))).toBe(true);
    });

    test('гость → active-поток: Программа и Детали видны (S02)', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );
      const activeButton = findButton(catalogResp, '🔵');
      const viewResp = await router.handleCallback(
        activeButton.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(viewResp);
      const btns =
        viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btns.some((t) => t.includes('Детали'))).toBe(true);
    });
  });

  // Трек 6: кнопка «👥 Студенты» восстановлена. Гость видит список студентов.
  // TODO(Трек 5): Кандидат: от витрины к записи

  // ── «Программы курсов» — drill-up (обратная навигация) ──
  describe('«Программы курсов» — обратная навигация', () => {
    test('drill-down 5 уровней → drill-up 4 уровня обратно', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');

      // Вперёд: 0 → 1 → 2 → 3 → 4
      const l0 = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const l1 = await router.handleCallback(
        findButton(l0, 'Основы').code,
        guest,
        NO_SESSION,
      );
      const l2 = await router.handleCallback(
        findButton(l1, 'Синтаксис').code,
        guest,
        NO_SESSION,
      );
      const l3 = await router.handleCallback(
        findButton(l2, 'JavaScript').code,
        guest,
        NO_SESSION,
      );
      const l4 = await router.handleCallback(
        findButton(l3, 'Введение').code,
        guest,
        NO_SESSION,
      );

      assertBotResponseValid(l4);
      expect(l4.sendMessage?.text).toContain('Проект: Введение');

      // Назад: 4 → 3
      const back43 = findButton(l4, 'Назад к модулю');
      const back3 = await router.handleCallback(back43.code, guest, NO_SESSION);
      assertBotResponseValid(back3);
      expect(back3.sendMessage?.text).toContain('Модуль: JavaScript');

      // Назад: 3 → 2
      const back32 = findButton(back3, 'Назад к этапу');
      const back2 = await router.handleCallback(back32.code, guest, NO_SESSION);
      assertBotResponseValid(back2);
      expect(back2.sendMessage?.text).toContain('Синтаксис');

      // Назад: 2 → 1
      const back21 = findButton(back2, 'Назад к курсу');
      const back1 = await router.handleCallback(back21.code, guest, NO_SESSION);
      assertBotResponseValid(back1);
      expect(back1.sendMessage?.text).toContain(
        'Курс: Основы программирования',
      );

      // Назад: 1 → 0
      const back10 = findButton(back1, 'Назад к курсам');
      const back0 = await router.handleCallback(back10.code, guest, NO_SESSION);
      assertBotResponseValid(back0);
      expect(back0.sendMessage?.text).toContain('Курсы');
    });

    test('drill-down → назад → другой путь', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');

      // Идём в Синтаксис
      const l0 = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const l1 = await router.handleCallback(
        findButton(l0, 'Основы').code,
        guest,
        NO_SESSION,
      );
      const l2 = await router.handleCallback(
        findButton(l1, 'Синтаксис').code,
        guest,
        NO_SESSION,
      );
      expect(l2.sendMessage?.text).toContain('Синтаксис');

      // Возвращаемся к курсу
      const back1 = await router.handleCallback(
        findButton(l2, 'Назад к курсу').code,
        guest,
        NO_SESSION,
      );

      // Идём в другой этап — Алгоритмика
      const algoBtn = findButton(back1, 'Алгоритмика');
      const algoResp = await router.handleCallback(
        algoBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(algoResp);
      expect(algoResp.sendMessage?.text).toContain('Алгоритмика');
    });

    test('c карточки курса — Главное меню', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const l0 = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );

      const mainMenuBtn = findButton(l0, 'Главное меню');
      const mainResp = await router.handleCallback(
        mainMenuBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(mainResp);
      expect(mainResp.sendMessage?.text).toContain('Выберите действие');
    });
  });

  // ── «Потоки курсов» — полный round-trip ──
  describe('«Потоки курсов» — round-trip навигация', () => {
    test('каталог → карточка → программа → назад → детали → назад → каталог', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');

      // S01: каталог
      const catalog = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(catalog);

      // → S02: карточка enrollment-потока
      const card = await router.handleCallback(
        findButton(catalog, '🟡').code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(card);
      expect(card.sendMessage?.text).toContain('JS Core');

      // → S03: программа
      const program = await router.handleCallback(
        findButton(card, 'Программа курса').code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(program);
      expect(program.sendMessage?.text).toContain('Программа курса');
      expect(program.sendMessage?.text).toContain('📁');

      // ← назад к карточке
      const backToCard = await router.handleCallback(
        findButton(program, 'Назад к потоку').code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(backToCard);
      expect(backToCard.sendMessage?.text).toContain('JS Core');

      // → S04: детали
      const details = await router.handleCallback(
        findButton(backToCard, 'Детали').code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(details);
      expect(details.sendMessage?.text).toContain('Детали');

      // ← назад к карточке
      const backAgain = await router.handleCallback(
        findButton(details, 'Назад к потоку').code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(backAgain);
      expect(backAgain.sendMessage?.text).toContain('JS Core');

      // ← назад к каталогу
      const backToCatalog = await router.handleCallback(
        findButton(backAgain, 'Назад к списку').code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(backToCatalog);
      expect(backToCatalog.sendMessage?.text).toContain('Потоки курсов');
    });

    test('каталог → active-поток → программа → назад → каталог', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');

      const catalog = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );
      const card = await router.handleCallback(
        findButton(catalog, '🔵').code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(card);
      expect(card.sendMessage?.text).toContain('Поток 2');

      const program = await router.handleCallback(
        findButton(card, 'Программа курса').code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(program);
      expect(program.sendMessage?.text).toContain('📁');

      // Назад к карточке
      const back1 = await router.handleCallback(
        findButton(program, 'Назад к потоку').code,
        guest,
        NO_SESSION,
      );
      // Назад к каталогу
      const backCatalog = await router.handleCallback(
        findButton(back1, 'Назад к списку').code,
        guest,
        NO_SESSION,
      );
      expect(backCatalog.sendMessage?.text).toContain('Потоки курсов');
    });

    test('каталог → Главное меню', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalog = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );

      const mainMenuBtn = findButton(catalog, 'Главное меню');
      const mainResp = await router.handleCallback(
        mainMenuBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(mainResp);
      expect(mainResp.sendMessage?.text).toContain('Выберите действие');
    });

    test('несуществующий поток — ошибка', async () => {
      const response = await router.handleCallback(
        'stream:view-stream:view:ffffffff-ffff-ffff-ffff-ffffffffffff',
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(response);
      expect(response.sendMessage?.text).toContain('не найден');
    });
  });

  // ── Сквозной: курсы ↔ потоки ──
  describe('Сквозная навигация: курсы ↔ потоки', () => {
    test('главное меню → курсы → назад → потоки → карточка → назад', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];

      // Курсы
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const courses = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      expect(courses.sendMessage?.text).toContain('Курсы');

      // Назад в главное меню
      const main1 = await router.handleCallback(
        findButton(courses, 'Главное меню').code,
        guest,
        NO_SESSION,
      );
      expect(main1.sendMessage?.text).toContain('Выберите действие');

      // Потоки
      const streamBtn = findMenuItem(
        (await router.collectMainMenu(guest)) as CbMainMenuAction[],
        'Потоки курсов',
      );
      const catalog = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );
      expect(catalog.sendMessage?.text).toContain('Потоки курсов');

      const card = await router.handleCallback(
        findButton(catalog, '🟡').code,
        guest,
        NO_SESSION,
      );
      expect(card.sendMessage?.text).toContain('JS Core');

      const main2 = await router.handleCallback(
        findButton(card, 'Назад к списку').code,
        guest,
        NO_SESSION,
      );
      expect(main2.sendMessage?.text).toContain('Потоки курсов');
    });

    test('handleHelp показывает описания курсов и потоков', async () => {
      const response = await router.handleHelp(guest);
      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Как со мной работать');
      expect(text).toContain('Программы курсов');
      expect(text).toContain('Потоки курсов');
    });
  });
});
