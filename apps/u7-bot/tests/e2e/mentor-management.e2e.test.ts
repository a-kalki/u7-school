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

/**
 * Находит кнопку на клавиатуре по частичному совпадению текста.
 */
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

/**
 * Находит пункт в главном меню по частичному совпадению текста.
 */
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

/**
 * E2E: Ментор — управление студентами через «Инструменты ментора».
 *
 * Путь: главное меню → «🛠️ Инструменты ментора» → «📋 Мои потоки»
 *       → карточка потока → «👥 Студенты» → действия со студентами.
 */
describe('E2E: Ментор — управление студентами', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-mentor');
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
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Список студентов через менторскую карточку ──

  test('ментор → мои потоки → «👥 Студенты» → список с менторскими кнопками ⛔✅', async () => {
    // 1. Главное меню ментора
    const menu = (await transport.collectMainMenu(
      mentor,
    )) as CbMainMenuAction[];
    const toolsBtn = findMenuItem(menu, 'Инструменты ментора');

    // 2. Подменю: нажимаем «📋 Мои потоки»
    const submenuResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: toolsBtn.action,
      }),
    );
    assertBotResponseValid(submenuResp);
    const myStreamsBtn = findButton(submenuResp, 'Мои потоки');

    // 3. Список моих потоков → выбираем активный (🔵)
    const myStreamsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: myStreamsBtn.code,
      }),
    );
    assertBotResponseValid(myStreamsResp);
    const activeBtn = findButton(myStreamsResp, '🔵');

    // 4. Менторская карточка потока
    const cardResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: activeBtn.code,
      }),
    );
    assertBotResponseValid(cardResp);
    const cardBtns =
      cardResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    // Должна быть кнопка «👥 Студенты»
    expect(cardBtns.some((t) => t.includes('Студенты'))).toBe(true);
    // Должны быть lifecycle-кнопки (ментор видит «Завершить» для active)
    expect(cardBtns.some((t) => t.includes('Завершить'))).toBe(true);

    // 5. Нажимаем «👥 Студенты»
    const studentsBtn = findButton(cardResp, 'Студенты');
    const studentsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: studentsBtn.code,
      }),
    );
    assertBotResponseValid(studentsResp);
    const studentsText = studentsResp.sendMessage?.text ?? '';
    expect(studentsText).not.toContain('Неизвестная команда');
    expect(studentsText).toContain('Студенты потока');

    // 6. Проверяем кнопки в списке студентов
    const allTexts =
      studentsResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    const allCodes =
      studentsResp.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];

    // Должны быть менторские кнопки ⛔✅ для активных студентов
    expect(allTexts).toContain('⛔');
    expect(allTexts).toContain('✅');

    // Кнопка ⛔ должна вести в monitor (MentorController)
    const abandonIdx = allTexts.indexOf('⛔');
    expect(abandonIdx).toBeGreaterThan(-1);
    expect(allCodes[abandonIdx]).toStartWith('mentor:monitor:mark-abandoned:');

    // Кнопка ✅ должна вести в monitor (MentorController)
    const completeIdx = allTexts.indexOf('✅');
    expect(completeIdx).toBeGreaterThan(-1);
    expect(allCodes[completeIdx]).toStartWith('mentor:monitor:complete:');

    // Кнопка-имя студента должна вести в monitor:detail
    const detailCodes = allCodes.filter((c) => c.includes('monitor:detail:'));
    expect(detailCodes.length).toBeGreaterThan(0);
  });

  // ── Диалог mark-abandoned ──

  test('ментор: ⛔ mark-abandoned → подтверждение → отмена → возврат к карточке', async () => {
    // 1. Получаем список студентов
    const menu = (await transport.collectMainMenu(
      mentor,
    )) as CbMainMenuAction[];
    const toolsBtn = findMenuItem(menu, 'Инструменты ментора');
    const submenuResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: toolsBtn.action,
      }),
    );
    const myStreamsBtn = findButton(submenuResp, 'Мои потоки');
    const myStreamsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: myStreamsBtn.code,
      }),
    );
    const activeBtn = findButton(myStreamsResp, '🔵');
    const cardResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: activeBtn.code,
      }),
    );
    const studentsBtn = findButton(cardResp, 'Студенты');
    const studentsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: studentsBtn.code,
      }),
    );

    // 2. Нажимаем ⛔ на первом студенте
    const abandonBtn = findButton(studentsResp, '⛔');
    const confirmResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: abandonBtn.code,
      }),
    );
    assertBotResponseValid(confirmResp);
    const confirmText = confirmResp.sendMessage?.text ?? '';

    // Должен быть диалог подтверждения
    expect(confirmText).toContain('Снять студента');
    expect(confirmText).not.toContain('Неизвестная команда');

    // Кнопки подтверждения/отмены
    const confirmBtns =
      confirmResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(confirmBtns.some((t) => t.includes('Да'))).toBe(true);
    expect(confirmBtns.some((t) => t.includes('Отмена'))).toBe(true);

    // 3. Нажимаем отмену → возврат к детальной карточке студента
    const cancelBtn = findButton(confirmResp, 'Отмена');
    const cancelResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: cancelBtn.code,
      }),
    );
    assertBotResponseValid(cancelResp);
    const cancelText = cancelResp.sendMessage?.text ?? '';
    expect(cancelText).not.toContain('Неизвестная команда');
  });

  test('ментор: ⛔ mark-abandoned → подтвердить → студент отчислен', async () => {
    // 1. Получаем список студентов
    const menu = (await transport.collectMainMenu(
      mentor,
    )) as CbMainMenuAction[];
    const toolsBtn = findMenuItem(menu, 'Инструменты ментора');
    const submenuResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: toolsBtn.action,
      }),
    );
    const myStreamsBtn = findButton(submenuResp, 'Мои потоки');
    const myStreamsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: myStreamsBtn.code,
      }),
    );
    const activeBtn = findButton(myStreamsResp, '🔵');
    const cardResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: activeBtn.code,
      }),
    );
    const studentsBtn = findButton(cardResp, 'Студенты');
    const studentsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: studentsBtn.code,
      }),
    );
    assertBotResponseValid(studentsResp);

    // 2. Нажимаем ⛔ на первом студенте
    const abandonBtn = findButton(studentsResp, '⛔');
    const confirmResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: abandonBtn.code,
      }),
    );
    assertBotResponseValid(confirmResp);

    // 3. Нажимаем «Да, неактивен» (подтвердить)
    const confirmActionBtn = findButton(confirmResp, 'Да, неактивен');
    const resultResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: confirmActionBtn.code,
      }),
    );
    assertBotResponseValid(resultResp);

    // После mark-abandoned — делегирование к списку студентов.
    const finalText2 =
      resultResp.sendMessage?.text ?? resultResp.sendMessages?.[0]?.text ?? '';
    expect(finalText2).toContain('снят с учёбы');
  });

  test('ментор: ✅ complete → выбрать «Прошёл» → подтвердить → студент завершён', async () => {
    // 1. Получаем список студентов
    const menu = (await transport.collectMainMenu(
      mentor,
    )) as CbMainMenuAction[];
    const toolsBtn = findMenuItem(menu, 'Инструменты ментора');
    const submenuResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: toolsBtn.action,
      }),
    );
    const myStreamsBtn = findButton(submenuResp, 'Мои потоки');
    const myStreamsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: myStreamsBtn.code,
      }),
    );
    const activeBtn = findButton(myStreamsResp, '🔵');
    const cardResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: activeBtn.code,
      }),
    );
    const studentsBtn = findButton(cardResp, 'Студенты');
    let studentsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: studentsBtn.code,
      }),
    );
    assertBotResponseValid(studentsResp);

    // Дефолт — только активные; показываем всех (FR-8)
    const showAllBtn = findButton(studentsResp, 'Показать выбывших');
    studentsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: showAllBtn.code,
      }),
    );
    assertBotResponseValid(studentsResp);

    // 2. Находим перезавершаемого студента и нажимаем 🔄
    const redoBtn = findButton(studentsResp, '🔄');
    const choiceResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: redoBtn.code,
      }),
    );
    assertBotResponseValid(choiceResp);
    expect(choiceResp.sendMessage?.text).toContain('Выберите исход');

    // 3. Выбираем «Прошёл»
    const advancedBtn = findButton(choiceResp, 'Прошёл');
    const confirmResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: advancedBtn.code,
      }),
    );
    assertBotResponseValid(confirmResp);
    expect(confirmResp.sendMessage?.text).toContain('прошёл');

    // 4. Подтверждаем
    const confirmActionBtn = findButton(confirmResp, 'Завершить');
    const resultResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: confirmActionBtn.code,
      }),
    );
    assertBotResponseValid(resultResp);

    // После complete — делегирование к списку студентов.
    const finalText =
      resultResp.sendMessage?.text ?? resultResp.sendMessages?.[0]?.text ?? '';
    expect(finalText).toContain('завершён');
  });

  test('ментор: карточка студента (detail) — видна с «Назад к списку»', async () => {
    // 1. Получаем список студентов
    const menu = (await transport.collectMainMenu(
      mentor,
    )) as CbMainMenuAction[];
    const toolsBtn = findMenuItem(menu, 'Инструменты ментора');
    const submenuResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: toolsBtn.action,
      }),
    );
    const myStreamsBtn = findButton(submenuResp, 'Мои потоки');
    const myStreamsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: myStreamsBtn.code,
      }),
    );
    const activeBtn = findButton(myStreamsResp, '🔵');
    const cardResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: activeBtn.code,
      }),
    );
    const studentsBtn = findButton(cardResp, 'Студенты');
    let studentsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: studentsBtn.code,
      }),
    );
    assertBotResponseValid(studentsResp);

    // Карточка advanced-студента — только в режиме «все» (FR-8)
    const showAllBtn = findButton(studentsResp, 'Показать выбывших');
    studentsResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: showAllBtn.code,
      }),
    );
    assertBotResponseValid(studentsResp);

    // 2. Кликаем на имя студента (detail)
    const studentRows = studentsResp.sendMessage?.keyboard?.rows ?? [];
    const detailRow = studentRows.find((r) =>
      r.some((b) => b.code.includes('monitor:detail')),
    );
    expect(detailRow).toBeDefined();
    const detailBtn = detailRow!.find((b) =>
      b.code.includes('monitor:detail'),
    )!;

    const detailResp = await transport.handleCallback(
      transport.makeBotContext(mentor.telegramId, {
        callbackData: detailBtn.code,
      }),
    );
    assertBotResponseValid(detailResp);

    const text = detailResp.sendMessage?.text ?? '';
    expect(text).toContain('Прогресс студента');
    expect(text).toContain('Усидчивость');
    expect(text).toContain('Активность');

    // Кнопка «Назад к списку»
    const backBtn = findButton(detailResp, 'Назад к списку');
    expect(backBtn).toBeDefined();
  });

  // ── Создание потока (S09 wizard) ──

  describe('Создание потока (wizard)', () => {
    test('полный цикл: меню → wizard (все шаги) → поток создан', async () => {
      // 1. Главное меню → Инструменты ментора
      const menu = (await transport.collectMainMenu(
        mentor,
      )) as CbMainMenuAction[];
      const toolsBtn = findMenuItem(menu, 'Инструменты ментора');

      const submenuResp = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: toolsBtn.action,
        }),
      );
      assertBotResponseValid(submenuResp);

      // 2. Подменю → Создать поток
      const createBtn = findButton(submenuResp, 'Создать поток');

      // Шаг 0: выбор модуля
      let resp = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: createBtn.code,
        }),
      );
      assertBotResponseValid(resp);
      expect(resp.sendMessage?.text).toContain('Выберите модуль');
      expect(resp.captureInput).toBeDefined();

      // Выбираем модуль
      const moduleBtn = findButton(resp, 'JavaScript Основы');

      // Шаг 1: название (с передачей контекста wizard'а)
      resp = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: moduleBtn.code,
        }),
      );
      assertBotResponseValid(resp);
      expect(resp.sendMessage?.text).toContain('название потока');

      // Принимаем название
      const acceptTitle = findButton(resp, 'Принять');
      resp = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: acceptTitle.code,
        }),
      );
      assertBotResponseValid(resp);
      expect(resp.sendMessage?.text).toContain('описание потока');

      // Шаг 2: вводим описание вручную
      resp = (await transport.handleMessage(
        transport.makeBotContext(mentor.telegramId, {
          text: 'E2E Тестовый Поток',
        }),
      ))!;
      assertBotResponseValid(resp);
      expect(resp.sendMessage?.text).toContain('дату старта');

      // Шаг 3: вводим дату
      resp = (await transport.handleMessage(
        transport.makeBotContext(mentor.telegramId, {
          text: '2026-12-15',
        }),
      ))!;
      assertBotResponseValid(resp);

      // Шаги 4-8: пропускаем все необязательные поля
      for (let i = 0; i < 5; i++) {
        const skipBtn = findButton(resp, 'Пропустить');
        resp = await transport.handleCallback(
          transport.makeBotContext(mentor.telegramId, {
            callbackData: skipBtn.code,
          }),
        );
        assertBotResponseValid(resp);
      }

      // Шаг 9: группа — пропускаем
      expect(resp.sendMessage?.text).toContain('Telegram');
      const skipGroup = findButton(resp, 'Пропустить');
      resp = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: skipGroup.code,
        }),
      );
      assertBotResponseValid(resp);

      // Шаг 10: кодовое слово — пропускаем
      expect(resp.sendMessage?.text).toContain('кодовое слово');
      const skipKey = findButton(resp, 'Пропустить');
      resp = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: skipKey.code,
        }),
      );
      assertBotResponseValid(resp);

      // Шаг 11: превью
      expect(resp.sendMessage?.text).toContain('Превью потока');
      expect(resp.sendMessage?.text).toContain('JavaScript Основы');
      expect(resp.sendMessage?.text).toContain('E2E Тестовый Поток');

      // Подтверждаем
      const confirmBtn = findButton(resp, 'Создать');
      resp = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: confirmBtn.code,
        }),
      );
      assertBotResponseValid(resp);

      expect(resp.sendMessage?.text).toContain('успешно создан');
      expect(resp.releaseInput).toBe(true);
    });

    test('отмена создания потока', async () => {
      // Начинаем wizard
      const menu = (await transport.collectMainMenu(
        mentor,
      )) as CbMainMenuAction[];
      const toolsBtn = findMenuItem(menu, 'Инструменты ментора');
      const submenuResp = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: toolsBtn.action,
        }),
      );
      const createBtn = findButton(submenuResp, 'Создать поток');
      const step0 = await transport.handleCallback(
        transport.makeBotContext(mentor.telegramId, {
          callbackData: createBtn.code,
        }),
      );
      assertBotResponseValid(step0);
      expect(step0.captureInput).toBeDefined();

      // Отменяем
      const cancelResp = (await transport.handleCancel(
        transport.makeBotContext(mentor.telegramId),
      ))!;
      assertBotResponseValid(cancelResp);
      expect(cancelResp.sendMessage?.text).toContain('отменено');
      expect(cancelResp.releaseInput).toBe(true);
    });
  });
});
