// @ts-nocheck
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { LearningController } from '@u7-scl/bot/learning/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestApp,
  type TestBotUiApp,
} from '@u7-scl/test-helpers/test-app';

/**
 * Интеграционный тест S05-S06: «Моя учёба» — хаб, шаги, дерево, прогресс.
 *
 * Фикстурные данные:
 *   Студент (telegramId: 1003) → записан на e1e1e1e1 (JS Core — Поток 2, active)
 *     currentStepId: d0d0d0d0 (Шаг 1: знакомство с переменными)
 *   Поток e1e1e1e1: 2 проекта, contentSnapshot с шагами
 */
describe('LearningController (интеграционный)', () => {
  let app: TestApp;
  let transport: TestBotUiApp;
  let student: User;
  const session: SessionData = { activeHandler: null };

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
  const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
  const STEP1_ID = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0';

  beforeAll(async () => {
    app = await createTestApp('learning-int');
    const streamController = new StreamsController();
    const learningController = new LearningController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    transport = new UiApp([
      appController,
      streamController,
      learningController,
    ]);
    transport.init(app.apiApp, (tgId: number) =>
      app.userFacade.getUserByTelegramId(tgId),
    );
    student = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Главное меню ──

  test('студент видит кнопку «🎓 Моя учёба» в главном меню', async () => {
    const menu = await transport.collectMainMenu(student);
    const btn = menu.find((i) => i.text.includes('Моя учёба'));
    expect(btn).toBeDefined();
    expect(btn!.kind).toBe('callback');
  });

  // ── Хаб «Моя учёба» ──

  test('learning:hub:my-study — показывает хаб с кнопками', async () => {
    const response = await transport.handleCallback(
      'learning:hub:my-study',
      student.telegramId,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Начать учёбу'))).toBe(true);
    expect(btns.some((t) => t.includes('Уроки'))).toBe(true);
    expect(btns.some((t) => t.includes('Мой прогресс'))).toBe(true);
    expect(btns.some((t) => t.includes('Покинуть поток'))).toBe(true);
  });

  // ── Продолжить учёбу (просмотр шага) ──

  test('learning:step-view:my-study:continue — показывает текущий шаг', async () => {
    const response = await transport.handleCallback(
      'learning:step-view:my-study:continue',
      student.telegramId,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Поток:');
    expect(text).toContain('JS Core');
    expect(text).toContain('Проект:');
    expect(text).toContain('Введение');
    expect(text).toContain('Шаг 1');
    expect(text).toContain('знакомство с переменными');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Выполнено'))).toBe(true);
    expect(btns.some((t) => t.includes('Главное меню'))).toBe(true);
  });

  // ── Дерево уроков (уровень 1: проекты) ──

  test('learning:nav-tree:my-study:lessons — показывает проекты', async () => {
    const response = await transport.handleCallback(
      'learning:nav-tree:my-study:lessons',
      student.telegramId,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Уроки');
    expect(text).toContain('Введение');
    expect(text).toContain('Циклы и функции');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Введение'))).toBe(true);
    expect(btns.some((t) => t.includes('Циклы и функции'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к учёбе'))).toBe(true);
  });

  // ── Уровень 2: уроки проекта ──

  test('learning:nav-tree:my-study:project:1 — показывает уроки проекта', async () => {
    const response = await transport.handleCallback(
      'learning:nav-tree:my-study:project:1',
      student.telegramId,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные и типы');
    expect(text).toContain('Условные операторы');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Переменные и типы'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к проектам'))).toBe(true);
  });

  // ── Уровень 3: шаги урока ──

  test('learning:nav-tree:my-study:lesson:c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0 — показывает шаги', async () => {
    const LESSON_ID = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0';
    const response = await transport.handleCallback(
      `learning:nav-tree:my-study:lesson:${LESSON_ID}`,
      student.telegramId,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Переменные и типы');
    // d0d0d0d0 — текущий шаг (▶️), d1d1d1d1 — будущий (🔒)
    expect(text).toContain('▶️');
    expect(text).toContain('знакомство с переменными');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Только текущий шаг доступен как кнопка
    expect(btns.some((t) => t.includes('знакомство'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к урокам'))).toBe(true);
  });

  // ── Прогресс ──

  test('learning:progress:progress:{streamId} — показывает прогресс', async () => {
    const response = await transport.handleCallback(
      `learning:progress:progress:${STREAM_ID}`,
      student.telegramId,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Мой прогресс');
    expect(text).toContain('JS Core');
    expect(text).toContain('Общий:');
    expect(text).toContain('Всего шагов завершено');
  });

  // ── Выход из потока ──

  test('learning:hub:my-study:leave-confirm — показывает диалог подтверждения', async () => {
    const response = await transport.handleCallback(
      'learning:hub:my-study:leave-confirm',
      student.telegramId,
      session,
    );
    assertBotResponseValid(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('уверены');

    const btns =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Да'))).toBe(true);
    expect(btns.some((t) => t.includes('Отмена'))).toBe(true);
  });

  // ── Неизвестная команда ──

  test('неизвестный контроллер → ошибка', async () => {
    const response = await transport.handleCallback(
      'unknown:cmd:test',
      student.telegramId,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });
});
