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
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  screensNewFirst,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

/** Последний отправленный экран пользователя (send+edit по messageId). */
function lastScreen(transport: TestBotTransport, tgId: number) {
  const [screen] = screensNewFirst(transport, tgId);
  if (!screen) throw new Error(`Нет экранов у пользователя ${tgId}`);
  return screen;
}

/** Отштампованный код кнопки по предикату кода (для мостов controller:…). */
function pressedCodeBy(
  transport: TestBotTransport,
  tgId: number,
  predicate: (code: string) => boolean,
): string {
  for (const screen of screensNewFirst(transport, tgId)) {
    const btn = screen.keyboard?.rows.flat().find((b) => predicate(b.code));
    if (btn) return btn.code;
  }
  throw new Error(`Кнопка по предикату не найдена на экранах ${tgId}`);
}

/**
 * E2E: Ментор — управление студентами через «Инструменты ментора».
 *
 * Путь: главное меню → «🛠️ Инструменты ментора» → «📋 Мои потоки»
 *       → карточка потока → «👥 Студенты» → действия со студентами.
 *
 * Контракт «Диалог и Экран»: коды кнопок берутся отштампованными
 * из Api-записи предыдущего экрана (:~seq36 — как реальный клиент),
 * содержимое ответа ассертится по DialogResponse (notify и screen
 * разделены: реплика результата — notify, целевой экран — screen).
 */
describe('E2E: Ментор — управление студентами', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let mentor: User;
  let tgId: number;

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
    tgId = mentor.telegramId;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  /** Меню → подменю → мои потоки → активный поток → «Студенты». */
  async function openStudents() {
    await transport.handleStart(transport.makeBotContext(tgId));
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Инструменты ментора'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Мои потоки'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, '🔵'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Студенты'),
      }),
    );
  }

  // ── Список студентов через менторскую карточку ──

  test('ментор → мои потоки → «👥 Студенты» → список с менторскими кнопками ⛔✅', async () => {
    await transport.handleStart(transport.makeBotContext(tgId));

    // 2. Подменю: «📋 Мои потоки»
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Инструменты ментора'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Мои потоки'),
      }),
    );

    // 3. Список моих потоков → активный (🔵)
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, '🔵'),
      }),
    );

    // 4. Менторская карточка потока: «👥 Студенты» + lifecycle «Завершить»
    const card = lastScreen(transport, tgId);
    const cardBtns = card.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(cardBtns.some((t) => t.includes('Студенты'))).toBe(true);
    expect(cardBtns.some((t) => t.includes('Завершить'))).toBe(true);

    // 5. Нажимаем «👥 Студенты» → менторский список (monitor)
    const studentsResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Студенты'),
      }),
    );
    expect(String(studentsResp.screen?.text)).not.toContain('Неизвестная');
    expect(String(studentsResp.screen?.text)).toContain('Студенты потока');

    // 6. Кнопки в списке студентов
    const allTexts =
      lastScreen(transport, tgId)
        .keyboard?.rows.flat()
        .map((b) => b) ?? [];

    // Менторские кнопки ⛔✅ для активных студентов
    expect(allTexts.map((b) => b.text)).toContain('⛔');
    expect(allTexts.map((b) => b.text)).toContain('✅');

    // Кнопка ⛔ ведёт в monitor (MentorController)
    const abandon = allTexts.find((b) => b.text === '⛔')!;
    expect(abandon.code).toStartWith('mentor:monitor:mark-abandoned:');

    // Кнопка ✅ ведёт в monitor (MentorController)
    const complete = allTexts.find((b) => b.text === '✅')!;
    expect(complete.code).toStartWith('mentor:monitor:complete:');

    // Кнопка-имя студента ведёт в monitor:detail
    const detailCodes = allTexts
      .map((b) => b.code)
      .filter((c) => c.includes('monitor:detail:'));
    expect(detailCodes.length).toBeGreaterThan(0);
  });

  // ── Диалог mark-abandoned ──

  test('ментор: ⛔ mark-abandoned → подтверждение → отмена → возврат к карточке', async () => {
    await openStudents();

    // 2. ⛔ на первом студенте → confirm-диалог
    const confirmResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, '⛔'),
      }),
    );

    // Диалог подтверждения с репликой-экраном
    expect(String(confirmResp.screen?.text)).toContain('Снять студента');
    expect(String(confirmResp.screen?.text)).not.toContain('Неизвестная');

    // Кнопки подтверждения/отмены
    const confirmBtns =
      confirmResp.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(confirmBtns.some((t) => t.includes('Да'))).toBe(true);
    expect(confirmBtns.some((t) => t.includes('Отмена'))).toBe(true);

    // 3. Отмена → возврат к детальной карточке студента (monitor:detail)
    const cancelResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Отмена'),
      }),
    );
    expect(String(cancelResp.screen?.text)).not.toContain('Неизвестная');
    expect(String(cancelResp.screen?.text)).toContain('Прогресс студента');
  });

  test('ментор: ⛔ mark-abandoned → подтвердить → студент отчислен', async () => {
    await openStudents();

    // 2. ⛔ на первом студенте → confirm-диалог → «⚠️ Да, неактивен»:
    //    реплика результата + delegate к списку студентов
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, '⛔'),
      }),
    );
    const resultResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Да, неактивен'),
      }),
    );
    expect(resultResp.notify?.text).toContain('снят с учёбы');
    expect(String(resultResp.screen?.text)).toContain('Студенты потока');
  });

  test('ментор: ✅ complete → выбрать «Прошёл» → подтвердить → студент завершён', async () => {
    await openStudents();

    // Дефолт — только активные; показываем всех (FR-8)
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Показать выбывших'),
      }),
    );

    // 2. 🔄 у перезавершаемого студента → выбор исхода
    const choiceResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, '🔄'),
      }),
    );
    expect(String(choiceResp.screen?.text)).toContain('Выберите исход');

    // 3. Выбираем «✅ Прошёл» → confirm-диалог
    const confirmResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Прошёл'),
      }),
    );
    expect(String(confirmResp.screen?.text)).toContain('прошёл');

    // 4. Подтверждаем: реплика + delegate к списку
    const resultResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Завершить'),
      }),
    );
    expect(resultResp.notify?.text).toContain('завершён');
    expect(String(resultResp.screen?.text)).toContain('Студенты потока');
  });

  test('ментор: карточка студента (detail) — видна с «Назад к списку»', async () => {
    await openStudents();

    // Карточка advanced-студента — только в режиме «все» (FR-8)
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Показать выбывших'),
      }),
    );

    // 2. Кликаем на кнопку-имя студента (monitor:detail)
    const detailResp = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCodeBy(transport, tgId, (c) =>
          c.includes('monitor:detail'),
        ),
      }),
    );

    const text = String(detailResp.screen?.text);
    expect(text).toContain('Прогресс студента');
    expect(text).toContain('Усидчивость');
    expect(text).toContain('Активность');

    // Кнопка «Назад к списку»
    const backBtn = lastScreen(transport, tgId)
      .keyboard?.rows.flat()
      .find((b) => b.text.includes('Назад к списку'));
    expect(backBtn).toBeDefined();
  });

  // ── Создание потока (S09 wizard) ──

  describe('Создание потока (wizard)', () => {
    test('полный цикл: меню → wizard (все шаги) → поток создан', async () => {
      await transport.handleStart(transport.makeBotContext(tgId));

      // 1-2. Инструменты ментора → Создать поток (шаг 0: выбор модуля)
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Инструменты ментора'),
        }),
      );
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Создать поток'),
        }),
      );
      const step0 = lastScreen(transport, tgId);
      expect(String(step0.text)).toContain('Выберите модуль');
      expect(
        step0.keyboard?.rows
          .flat()
          .some((b) => b.text.includes('JavaScript Основы')),
      ).toBe(true);

      // Шаг 1: название
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'JavaScript Основы'),
        }),
      );
      const step1 = lastScreen(transport, tgId);
      expect(String(step1.text)).toContain('название потока');

      // Принимаем название
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Принять'),
        }),
      );
      const step2 = lastScreen(transport, tgId);
      expect(String(step2.text)).toContain('описание потока');

      // Шаг 2: вводим описание вручную
      const step3 = await transport.handleMessage(
        transport.makeBotContext(tgId, { text: 'E2E Тестовый Поток' }),
      );
      expect(String(step3.screen?.text)).toContain('дату старта');

      // Шаг 3: вводим дату
      const step4 = await transport.handleMessage(
        transport.makeBotContext(tgId, { text: '2026-12-15' }),
      );
      expect(String(step4.screen?.text)).toContain('Цель');

      // Шаги 4-8: пропускаем все необязательные поля
      for (let i = 0; i < 5; i++) {
        await transport.handleCallback(
          transport.makeBotContext(tgId, {
            callbackData: pressedCode(transport, tgId, 'Пропустить'),
          }),
        );
      }
      expect(String(lastScreen(transport, tgId).text)).toContain('Telegram');

      // Шаг 9: группа (ID) — пропускаем
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Пропустить'),
        }),
      );
      expect(String(lastScreen(transport, tgId).text)).toContain('инвайт');

      // Шаг 10: инвайт-ссылка — пропускаем
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Пропустить'),
        }),
      );
      expect(String(lastScreen(transport, tgId).text)).toContain(
        'кодовое слово',
      );

      // Шаг 11: кодовое слово — пропускаем → превью
      const previewResp = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Пропустить'),
        }),
      );
      const preview = String(previewResp.screen?.text);
      expect(preview).toContain('Превью потока');
      expect(preview).toContain('JavaScript Основы');
      expect(preview).toContain('E2E Тестовый Поток');

      // Подтверждаем: поток создан, ввод освобождён
      const finalResp = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Создать'),
        }),
      );
      expect(String(finalResp.screen?.text)).toContain('успешно создан');
      expect(finalResp.release).toBe(true);
    });

    test('отмена создания потока', async () => {
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Инструменты ментора'),
        }),
      );
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Создать поток'),
        }),
      );
      const step0 = lastScreen(transport, tgId);
      expect(String(step0.text)).toContain('Выберите модуль');

      // Отменяем (/cancel — команда pipe: активная стори стопается)
      const cancelResp = await transport.handleCancel(
        transport.makeBotContext(tgId),
      );
      expect(cancelResp.notify?.text).toContain('отменено');
      expect(cancelResp.release).toBe(true);
    });
  });
});
