import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { LearningController } from '@u7-scl/bot/learning/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  screensNewFirst,
  stampedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

/**
 * Интеграционный тест S05-S06: «Моя учёба» — хаб, шаги, дерево, прогресс.
 *
 * Контракт «Диалог и Экран»: ассерты — по DialogResponse, захваченному
 * на границе uiApp; коды прямых вызовов штампуются актуальным штампом
 * открытого экрана (transport валидирует штампы на входе). Политика
 * рендера (edit/send/retire) проверяется по Api-записям мок-Telegram.
 *
 * Фикстурные данные:
 *   Студент (telegramId: 1003) → записан на e1e1e1e1 (JS Core — Поток 2, active)
 *     currentStepId: d0d0d0d0 (Шаг 1: знакомство с переменными)
 *   Поток e1e1e1e1: 2 проекта, contentSnapshot с шагами
 */
describe('LearningController (интеграционный)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let student: User;

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
  const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
  const LESSON_ID = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0';

  beforeAll(async () => {
    app = await createTestApp('learning-int');
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

  afterAll(async () => {
    await app.cleanup();
  });

  /** Открывает диалог студента (/start → welcome-экран со штампом). */
  async function openDialog(): Promise<void> {
    await transport.handleStart(transport.makeBotContext(student.telegramId));
  }

  /** Прямой вызов кода с актуальным штампом открытого экрана. */
  async function callRaw(code: string) {
    return transport.handleCallback(
      transport.makeBotContext(student.telegramId, {
        callbackData: stampedCode(transport, student.telegramId, code),
      }),
    );
  }

  // ── Главное меню ──

  test('студент видит кнопку «🎓 Моя учёба» в главном меню', async () => {
    const menu = await transport.collectMainMenu(student);
    const btn = menu.find((i) => i.text.includes('Моя учёба'));
    expect(btn).toBeDefined();
    expect(btn!.kind).toBe('callback');
    if (btn!.kind === 'callback') {
      expect(btn!.action).toBe('learning:hub:my-study');
    }
  });

  // ── Хаб «Моя учёба» ──

  test('learning:hub:my-study — экран хаба с кнопками', async () => {
    await openDialog();
    const response = await callRaw('learning:hub:my-study');

    const text = String(response.screen?.text);
    expect(text).toContain('Моя учёба');

    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Начать учёбу'))).toBe(true);
    expect(btns.some((t) => t.includes('Уроки'))).toBe(true);
    expect(btns.some((t) => t.includes('Мой прогресс'))).toBe(true);
    expect(btns.some((t) => t.includes('Покинуть учёбу'))).toBe(true);
  });

  // ── Продолжить учёбу (просмотр шага) ──

  test('learning:step-view:my-study:continue — экран текущего шага', async () => {
    const response = await callRaw('learning:step-view:my-study:continue');

    const text = String(response.screen?.text);
    expect(text).toContain('Поток:');
    expect(text).toContain('JS Core');
    expect(text).toContain('Проект:');
    expect(text).toContain('Введение');
    expect(text).toContain('Шаг 1');
    expect(text).toContain('знакомство с переменными');

    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Выполнено'))).toBe(true);
    expect(btns.some((t) => t.includes('Главное меню'))).toBe(true);
  });

  // ── Дерево уроков (уровень 1: проекты) ──

  test('learning:nav-tree:my-study:lessons — экран проектов', async () => {
    const response = await callRaw('learning:nav-tree:my-study:lessons');

    const text = String(response.screen?.text);
    expect(text).toContain('Уроки');
    expect(text).toContain('Введение');
    expect(text).toContain('Циклы и функции');

    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Введение'))).toBe(true);
    expect(btns.some((t) => t.includes('Циклы и функции'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к учёбе'))).toBe(true);
  });

  // ── Уровень 2: уроки проекта ──

  test('learning:nav-tree:my-study:project:1 — экран уроков проекта', async () => {
    const response = await callRaw('learning:nav-tree:my-study:project:1');

    const text = String(response.screen?.text);
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные и типы');
    expect(text).toContain('Условные операторы');

    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Переменные и типы'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к проектам'))).toBe(true);
  });

  // ── Уровень 3: шаги урока ──

  test(`learning:nav-tree:my-study:lesson — экран шагов`, async () => {
    const response = await callRaw(
      `learning:nav-tree:my-study:lesson:${LESSON_ID}`,
    );

    const text = String(response.screen?.text);
    expect(text).toContain('Переменные и типы');
    // d0d0d0d0 — текущий шаг (▶️), d1d1d1d1 — будущий (🔒)
    expect(text).toContain('▶️');
    expect(text).toContain('знакомство с переменными');

    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    // Только текущий шаг доступен как кнопка
    expect(btns.some((t) => t.includes('знакомство'))).toBe(true);
    expect(btns.some((t) => t.includes('Назад к урокам'))).toBe(true);
  });

  // ── Прогресс ──

  test('learning:progress:progress:{streamId} — экран прогресса', async () => {
    const response = await callRaw(`learning:progress:progress:${STREAM_ID}`);

    const text = String(response.screen?.text);
    expect(text).toContain('Мой прогресс');
    expect(text).toContain('JS Core');
    expect(text).toContain('Общий:');
    expect(text).toContain('Всего шагов завершено');
  });

  // ── Выход из потока ──

  test('learning:hub:my-study:leave-confirm — confirm «Покинуть учёбу?»', async () => {
    const response = await callRaw('learning:hub:my-study:leave-confirm');

    const text = String(response.screen?.text);
    expect(text).toContain('Покинуть учёбу');
    expect(text).toContain('Прогресс сохранится');

    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('Да, покинуть'))).toBe(true);
    expect(btns.some((t) => t.includes('Остаться'))).toBe(true);
  });

  // ── Политика рендера: «владеешь экраном — edit» (§5.2) ──

  test('drill-down внутри nav-tree — edit на месте, без новых сообщений', async () => {
    const tgId = student.telegramId;
    transport.reset();
    await openDialog();

    const sentBefore = transport.api.sentMessages.length;

    // Мост в nav-tree (смена диалога → send)
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Уроки'),
      }),
    );
    const sentAfterEnter = transport.api.sentMessages.length;
    expect(sentAfterEnter).toBe(sentBefore + 1);

    // Drill-down: проект → урок — тот же dialog.path, экран наш → edit
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Введение'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Переменные и типы'),
      }),
    );

    // Новых сообщений нет — оба перехода отрендерены edit'ом
    expect(transport.api.sentMessages.length).toBe(sentAfterEnter);
    expect(transport.api.editedMessages.length).toBe(2);

    // Последний экран — шаги урока (edit существующего messageId)
    const lastScreen = screensNewFirst(transport, tgId)[0]!;
    expect(lastScreen.text).toContain('Переменные и типы');
  });

  test('смена стори (hub → nav-tree) — send нового + retire хаба с маркером выбора', async () => {
    const tgId = student.telegramId;
    transport.reset();
    await openDialog();

    // Открываем хаб кнопкой из меню
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Моя учёба'),
      }),
    );
    const hubScreenMessageId = transport.api.sentMessages.at(-1)!.messageId;

    // Мост «📂 Уроки» — смена диалога (learning/hub → learning/nav-tree)
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Уроки'),
      }),
    );

    // Retire хаба: edit его сообщения — маркер выбора, клавиатура снята
    const retireEdit = transport.api.editedMessages.find(
      (e) => e.messageId === hubScreenMessageId,
    );
    expect(retireEdit).toBeDefined();
    expect(retireEdit!.text).toContain('Вы выбрали: 📂 Уроки');
    expect(retireEdit!.keyboard).toBeUndefined();

    // Новый экран нав-дерева — send
    const treeScreen = transport.api.sentMessages.at(-1)!;
    expect(treeScreen.text).toContain('Уроки');
  });

  // ── Неизвестная команда ──

  test('неизвестный контроллер → экран «Неизвестная»', async () => {
    const response = await callRaw('unknown:cmd:test');
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });
});
