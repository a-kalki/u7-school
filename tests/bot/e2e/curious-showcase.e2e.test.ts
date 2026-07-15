import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/app/ui';
import type {
  BotResponse,
  CbMainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { CourseController } from '@u7-scl/course/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../helpers/test-app';
import { createTestApp } from '../helpers/test-app';

// ── Константы ──

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
const COURSE_UUID = 'fafafafa-baba-4aba-8aba-babababababa';
const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';
const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const MODULE_A0 = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';

const NO_SESSION: SessionData = { activeHandler: null };

// ── Хелперы ──

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
      `Кнопка с текстом «${textContains}» не найдена. Доступны: ${allTexts}`,
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

// ═══════════════════════════════════════════════════════════════════

describe('E2E: Витрина для любопытного', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;
  let candidate: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-curious');

    const streamController = new StreamController(app.streamModule);
    const courseController = new CourseController(app.courseModule);
    const appController = new AppController(SCHOOL_GROUP_URL);

    streamController.init(app.apiApp);
    courseController.init(app.apiApp);
    appController.init(app.apiApp);

    router = new BotRouter([appController, streamController, courseController]);

    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    candidate = (await app.userFacade.getUserByTelegramId(1002))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ────────────────────────────────────────────────
  // Главное меню: «Программы курсов» и «Потоки курсов» видны гостю
  // ────────────────────────────────────────────────
  describe('Главное меню гостя', () => {
    test('содержит «📖 Программы курсов» и «📚 Потоки курсов»', async () => {
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];

      const courseBtn = findMenuItem(menu, 'Программы курсов');
      expect(courseBtn.action).toStartWith('course:');

      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      expect(streamBtn.action).toStartWith('stream:');

      // Нет «Моя учёба» и «Создать поток»
      expect(menu.some((i) => i.text.includes('Моя учёба'))).toBe(false);
      expect(menu.some((i) => i.text.includes('Создать поток'))).toBe(false);
    });
  });

  // ────────────────────────────────────────────────
  // Сценарий «Программы курсов» (S00 → S00a → S00b)
  // ────────────────────────────────────────────────
  describe('«Программы курсов» — каталог, карточка, программа', () => {
    test('гость открывает каталог курсов → видит курс «Основы программирования»', async () => {
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');

      const response = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(response);

      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Программы курсов');
      expect(text).toContain('Основы программирования');

      // Должна быть кнопка на курс и кнопка «↩️ Главное меню»
      const btnTexts =
        response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Основы'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('↩️ Главное меню'))).toBe(true);
    });

    test('гость открывает карточку курса → видит фазы, «Развернуть программу», «Найти поток»', async () => {
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );

      // Найти кнопку с курсом
      const courseButton = findButton(catalogResp, 'Основы');
      const cardResp = await router.handleCallback(
        courseButton.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(cardResp);

      const text = cardResp.sendMessage?.text ?? '';
      expect(text).toContain('Основы программирования');
      expect(text).toContain('Синтаксис');
      expect(text).toContain('Алгоритмика');
      expect(text).toContain('этап');
      expect(text).toContain('модул');

      const btnTexts =
        cardResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Развернуть программу'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Найти поток'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
    });

    test('S00b.1: «Развернуть программу» → этапы и модули первого этапа inline', async () => {
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const cardResp = await router.handleCallback(
        courseButton.code,
        guest,
        NO_SESSION,
      );

      const programBtn = findButton(cardResp, 'Развернуть программу');
      const programResp = await router.handleCallback(
        programBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(programResp);

      const text = programResp.sendMessage?.text ?? '';
      expect(text).toContain('Программа: Основы программирования');
      expect(text).toContain('Синтаксис');
      // Курс «Основы программирования» имеет модуль a0... в фазе Синтаксис
      // Модуль называется «JavaScript Основы» (из фикстуры модулей)
      expect(text).toContain('JavaScript Основы');

      // Кнопка «Назад к карточке»
      const btnTexts =
        programResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Назад к карточке'))).toBe(true);
    });

    test('S00b.2: drill-down модуля — проекты и уроки inline', async () => {
      // Доходим до S00b.1
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const cardResp = await router.handleCallback(
        courseButton.code,
        guest,
        NO_SESSION,
      );
      const programBtn = findButton(cardResp, 'Развернуть программу');
      const programResp = await router.handleCallback(
        programBtn.code,
        guest,
        NO_SESSION,
      );

      // В тексте — название модуля, в кнопке — UUID модуля
      // Ищем кнопку модуля по началу UUID
      const moduleBtn = findButton(programResp, '📦 a0a0');
      const moduleResp = await router.handleCallback(
        moduleBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(moduleResp);

      const text = moduleResp.sendMessage?.text ?? '';
      expect(text).toContain('Введение');
      expect(text).toContain('Переменные и типы');
      expect(text).toContain('Циклы и функции');

      const btnTexts =
        moduleResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Назад к этапам'))).toBe(true);
    });

    test('S00b.3: drill-down урока — заголовки шагов без тел', async () => {
      // Доходим до S00b.2
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(
        courseBtn.action,
        guest,
        NO_SESSION,
      );
      const courseButton = findButton(catalogResp, 'Основы');
      const cardResp = await router.handleCallback(
        courseButton.code,
        guest,
        NO_SESSION,
      );
      const programBtn = findButton(cardResp, 'Развернуть программу');
      const programResp = await router.handleCallback(
        programBtn.code,
        guest,
        NO_SESSION,
      );
      // Поиск кнопки модуля в программе (UUID отображается в кнопке)
      // Нажимаем на модуль
      const moduleBtn = findButton(programResp, '📦 a0a0');
      const moduleResp = await router.handleCallback(
        moduleBtn.code,
        guest,
        NO_SESSION,
      );

      // Нажимаем на урок «Переменные и типы»
      const lessonBtn = findButton(moduleResp, 'Переменные');
      const lessonResp = await router.handleCallback(
        lessonBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(lessonResp);

      const text = lessonResp.sendMessage?.text ?? '';
      expect(text).toContain('Переменные и типы');
      // Только заголовки шагов, без тел
      expect(text).not.toContain('```');
      expect(text).not.toContain('function');

      // Должна быть кнопка «Назад»
      const btnTexts =
        lessonResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Назад к модулю'))).toBe(true);
    });
  });

  // ────────────────────────────────────────────────
  // Сценарий «Потоки курсов» — curious-режим S02
  // ────────────────────────────────────────────────
  describe('«Потоки курсов» — curious-режим карточки потока', () => {
    test('гость открывает каталог потоков → видит enrollment и active', async () => {
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');

      const response = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(response);

      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Потоки курсов');

      const btnTexts =
        response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(
        btnTexts.some((t) => t.includes('🟢') || t.includes('🔵')),
      ).toBe(true);
      expect(btnTexts.some((t) => t.includes('↩️ Главное меню'))).toBe(true);
    });

    test('гость открывает enrollment-поток → curious-режим: нет менторских кнопок', async () => {
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );

      const streamButton = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(
        streamButton.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(viewResp);

      const text = viewResp.sendMessage?.text ?? '';
      expect(text).toContain('JS Core');
      expect(text).toContain('Ментор');
      // Строчка «📚 Курс: Fullstack JS» в теле карточки (техдолг)
      expect(text).toContain('📚 Курс');
      expect(text).not.toContain('Неизвестная команда');

      // Кнопки для гостя на enrollment
      const btnTexts =
        viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);

      // В curious-режиме НЕТ менторских кнопок
      expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
      expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
      expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
    });

    test('гость открывает active-поток → «Программа курса» и «Детали» видны', async () => {
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
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

      const btnTexts =
        viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      // На active-потоке «Программа курса» и «Детали» видны (снято ограничение enrollment)
      expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    });

    test('гость → «Студенты» → список с прогресс-барами → карточка студента', async () => {
      const menu = (await router.collectMainMenu(
        guest,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(
        streamBtn.action,
        guest,
        NO_SESSION,
      );

      // Активный поток (есть студенты)
      const activeButton = findButton(catalogResp, '🔵');
      const viewResp = await router.handleCallback(
        activeButton.code,
        guest,
        NO_SESSION,
      );

      // «Студенты»
      const studentsBtn = findButton(viewResp, 'Студенты');
      const studentsResp = await router.handleCallback(
        studentsBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(studentsResp);

      const studentsText = studentsResp.sendMessage?.text ?? '';
      expect(studentsText).toContain('Студенты потока');
      expect(studentsText).not.toContain('Неизвестная');

      // Должен быть хотя бы один студент
      const studentBtn = studentsResp.sendMessage?.keyboard?.rows[0]?.[0];
      expect(studentBtn).toBeDefined();
      if (!studentBtn) return;

      // Карточка студента
      const detailResp = await router.handleCallback(
        studentBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(detailResp);

      const detailText = detailResp.sendMessage?.text ?? '';
      expect(detailText).not.toContain('Неизвестная');
      expect(detailText.length).toBeGreaterThan(0);

      // Гость НЕ видит кнопки ментора (Неактивен, Завершить)
      const detailBtnTexts =
        detailResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(detailBtnTexts.some((t) => t.includes('Неактивен'))).toBe(false);
      expect(detailBtnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    });
  });

  // ────────────────────────────────────────────────
  // Кандидат: от витрины к решению записаться
  // ────────────────────────────────────────────────
  describe('Кандидат: от витрины к записи', () => {
    test('кандидат видит «Программы курсов» и «Потоки курсов»', async () => {
      const menu = (await router.collectMainMenu(
        candidate,
      )) as CbMainMenuAction[];
      expect(menu.some((i) => i.text.includes('Программы курсов'))).toBe(true);
      expect(menu.some((i) => i.text.includes('Потоки курсов'))).toBe(true);
    });

    test('кандидат → поток → «Записаться» → успешная запись', async () => {
      const menu = (await router.collectMainMenu(
        candidate,
      )) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(
        streamBtn.action,
        candidate,
        NO_SESSION,
      );
      const streamButton = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(
        streamButton.code,
        candidate,
        NO_SESSION,
      );

      // «Записаться»
      const enrollBtn = findButton(viewResp, 'Записаться');
      const enrollResp = await router.handleCallback(
        enrollBtn.code,
        candidate,
        NO_SESSION,
      );
      assertBotResponseValid(enrollResp);

      const allTexts = [
        enrollResp.sendMessage?.text ?? '',
        ...(enrollResp.sendMessages ?? []).map((m) => m.text),
      ].join(' ');
      expect(allTexts).toContain('успешно записаны');
      expect(allTexts).toContain('JS Core');
    });

    test('после записи — студент найден в потоке', async () => {
      const studentRecord = await app.streamModule.execute(
        'get-student-by-user',
        { userId: candidate.uuid },
        candidate.uuid,
      );
      expect(studentRecord).toBeDefined();
      expect(studentRecord!.status).toBe('enrolled');
      expect(studentRecord!.streamId).toBe(ENROLLMENT_ID);
    });
  });
});
