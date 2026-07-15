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

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';

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
      const response = await router.handleCallback(courseBtn.action, guest, NO_SESSION);
      assertBotResponseValid(response);
      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Курсы');
      expect(text).toContain('Основы программирования');
      expect(text).toContain('Синтаксис');
      expect(text).toContain('Алгоритмика');
      const btns = response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Основы'))).toBe(true);
      expect(btns.some((t) => t.includes('↩️ Главное меню'))).toBe(true);
    });

    test('уровень 1: клик на курс → этапы + модули inline', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(courseBtn.action, guest, NO_SESSION);
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await router.handleCallback(courseButton.code, guest, NO_SESSION);
      assertBotResponseValid(phasesResp);
      const text = phasesResp.sendMessage?.text ?? '';
      expect(text).toContain('Курс: Основы программирования');
      expect(text).toContain('Синтаксис');
      expect(text).toContain('JavaScript Основы');
      const btns = phasesResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Синтаксис'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к курсам'))).toBe(true);
    });

    test('уровень 2: клик на этап → модули + проекты inline', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(courseBtn.action, guest, NO_SESSION);
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await router.handleCallback(courseButton.code, guest, NO_SESSION);
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await router.handleCallback(phaseBtn.code, guest, NO_SESSION);
      assertBotResponseValid(modulesResp);
      const text = modulesResp.sendMessage?.text ?? '';
      expect(text).toContain('Этап: Синтаксис');
      expect(text).toContain('JavaScript Основы');
      expect(text).toContain('Введение');
      const btns = modulesResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('JavaScript'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к курсу'))).toBe(true);
    });

    test('уровень 3: клик на модуль → проекты + уроки inline', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(courseBtn.action, guest, NO_SESSION);
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await router.handleCallback(courseButton.code, guest, NO_SESSION);
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await router.handleCallback(phaseBtn.code, guest, NO_SESSION);
      const moduleBtn = findButton(modulesResp, 'JavaScript');
      const projectsResp = await router.handleCallback(moduleBtn.code, guest, NO_SESSION);
      assertBotResponseValid(projectsResp);
      const text = projectsResp.sendMessage?.text ?? '';
      expect(text).toContain('Введение');
      expect(text).toContain('Переменные и типы');
      expect(text).toContain('Циклы и функции');
      const btns = projectsResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      // Кнопки — проекты (не уроки!)
      expect(btns.some((t) => t.includes('Введение'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к этапу'))).toBe(true);
    });

    test('уровень 4: клик на проект → уроки + шаги inline', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const courseBtn = findMenuItem(menu, 'Программы курсов');
      const catalogResp = await router.handleCallback(courseBtn.action, guest, NO_SESSION);
      const courseButton = findButton(catalogResp, 'Основы');
      const phasesResp = await router.handleCallback(courseButton.code, guest, NO_SESSION);
      const phaseBtn = findButton(phasesResp, 'Синтаксис');
      const modulesResp = await router.handleCallback(phaseBtn.code, guest, NO_SESSION);
      const moduleBtn = findButton(modulesResp, 'JavaScript');
      const projectsResp = await router.handleCallback(moduleBtn.code, guest, NO_SESSION);
      const projectBtn = findButton(projectsResp, 'Введение');
      const lessonsResp = await router.handleCallback(projectBtn.code, guest, NO_SESSION);
      assertBotResponseValid(lessonsResp);
      const text = lessonsResp.sendMessage?.text ?? '';
      expect(text).toContain('Проект: Введение');
      expect(text).toContain('Переменные и типы');
      expect(text).not.toContain('```');
      expect(text).not.toContain('function');
      const btns = lessonsResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Назад к модулю'))).toBe(true);
    });
  });

  // ── «Потоки курсов»: curious-режим ──
  describe('«Потоки курсов» — curious-режим карточки потока', () => {
    test('гость открывает каталог потоков', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const response = await router.handleCallback(streamBtn.action, guest, NO_SESSION);
      assertBotResponseValid(response);
      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Потоки курсов');
      const btns = response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('🟢') || t.includes('🔵'))).toBe(true);
      expect(btns.some((t) => t.includes('↩️ Главное меню'))).toBe(true);
    });

    test('гость → enrollment-поток: нет менторских кнопок', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(streamBtn.action, guest, NO_SESSION);
      const streamButton = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(streamButton.code, guest, NO_SESSION);
      assertBotResponseValid(viewResp);
      const text = viewResp.sendMessage?.text ?? '';
      expect(text).toContain('JS Core');
      expect(text).toContain('Ментор');
      expect(text).toContain('📚 Курс');
      expect(text).not.toContain('Неизвестная команда');
      const btns = viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Записаться'))).toBe(true);
      expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btns.some((t) => t.includes('Детали'))).toBe(true);
      expect(btns.some((t) => t.includes('Студенты'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);
      expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
      expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
      expect(btns.some((t) => t.includes('В архив'))).toBe(false);
    });

    test('гость → active-поток: Программа и Детали видны', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(streamBtn.action, guest, NO_SESSION);
      const activeButton = findButton(catalogResp, '🔵');
      const viewResp = await router.handleCallback(activeButton.code, guest, NO_SESSION);
      assertBotResponseValid(viewResp);
      const btns = viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btns.some((t) => t.includes('Детали'))).toBe(true);
    });

    test('гость → Студенты → список → карточка студента', async () => {
      const menu = (await router.collectMainMenu(guest)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(streamBtn.action, guest, NO_SESSION);
      const activeButton = findButton(catalogResp, '🔵');
      const viewResp = await router.handleCallback(activeButton.code, guest, NO_SESSION);
      const studentsBtn = findButton(viewResp, 'Студенты');
      const studentsResp = await router.handleCallback(studentsBtn.code, guest, NO_SESSION);
      assertBotResponseValid(studentsResp);
      const text = studentsResp.sendMessage?.text ?? '';
      expect(text).toContain('Студенты потока');
      expect(text).not.toContain('Неизвестная');
      const studentBtn = studentsResp.sendMessage?.keyboard?.rows[0]?.[0];
      expect(studentBtn).toBeDefined();
      if (!studentBtn) return;
      const detailResp = await router.handleCallback(studentBtn.code, guest, NO_SESSION);
      assertBotResponseValid(detailResp);
      const detailText = detailResp.sendMessage?.text ?? '';
      expect(detailText).not.toContain('Неизвестная');
      expect(detailText.length).toBeGreaterThan(0);
      const detailBtns = detailResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(detailBtns.some((t) => t.includes('Неактивен'))).toBe(false);
      expect(detailBtns.some((t) => t.includes('Завершить'))).toBe(false);
    });
  });

  // ── Кандидат: запись ──
  describe('Кандидат: от витрины к записи', () => {
    test('кандидат видит оба меню', async () => {
      const menu = (await router.collectMainMenu(candidate)) as CbMainMenuAction[];
      expect(menu.some((i) => i.text.includes('Программы курсов'))).toBe(true);
      expect(menu.some((i) => i.text.includes('Потоки курсов'))).toBe(true);
    });

    test('кандидат → поток → Записаться', async () => {
      const menu = (await router.collectMainMenu(candidate)) as CbMainMenuAction[];
      const streamBtn = findMenuItem(menu, 'Потоки курсов');
      const catalogResp = await router.handleCallback(streamBtn.action, candidate, NO_SESSION);
      const streamButton = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(streamButton.code, candidate, NO_SESSION);
      const enrollBtn = findButton(viewResp, 'Записаться');
      const enrollResp = await router.handleCallback(enrollBtn.code, candidate, NO_SESSION);
      assertBotResponseValid(enrollResp);
      const allTexts = [
        enrollResp.sendMessage?.text ?? '',
        ...(enrollResp.sendMessages ?? []).map((m) => m.text),
      ].join(' ');
      expect(allTexts).toContain('успешно записаны');
      expect(allTexts).toContain('JS Core');
    });

    test('после записи — студент в потоке', async () => {
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
