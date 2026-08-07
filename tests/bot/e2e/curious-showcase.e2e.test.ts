import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import type {
  BotResponse,
  CbMainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import { CoursesController } from '@u7-scl/bot/courses/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { TestApp } from '../helpers/test-app';
import { createTestApp } from '../helpers/test-app';

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
    throw new Error(
      `Пункт меню «${textContains}» не найден. Доступны: ${all}`,
    );
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
    router = new UiApp([appController, streamController, courseController]);
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
        lessonsResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ??
        [];
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
      // TODO(Трек 5): кнопка «Записаться» появится после миграции EnrollStory
      // expect(btns.some((t) => t.includes('Записаться'))).toBe(true);
      // TODO(Трек 6): кнопка «Студенты» появится после миграции MonitorStory
      // expect(btns.some((t) => t.includes('Студенты'))).toBe(true);
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

  // TODO(Трек 6): гость → Студенты → список → карточка студента
  // TODO(Трек 5): Кандидат: от витрины к записи
});
