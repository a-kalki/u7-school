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
import type { CbMenuButton, MenuButton } from '@u7-scl/bot/u7-menu';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

/** Экран в хронологии отображения: sent или edit (text + keyboard). */
interface ScreenRecord {
  text: string;
  keyboard?: { rows: Array<Array<{ text: string; code: string }>> };
}

/**
 * E2E: Витрина для любопытного (курсы + потоки, контракт «Диалог и Экран»).
 *
 * Паттерн нажатий: перед нажатием экран открыт (/start или предыдущая
 * кнопка), код берётся отштампованным из Api-записи (pressedCode) —
 * как реальный клиент. Содержимое ответа ассертится по DialogResponse,
 * захваченному на границе uiApp (screen/notify разделены).
 */

/**
 * Экраны пользователя в порядке отображения (новые первее).
 *
 * Api-записи ведут два массива (sent/edited); edit рендерит СУЩЕСТВУЮЩЕЕ
 * сообщение (messageId оригинала), поэтому хронология восстанавливается
 * так: sent-ы по порядку, каждый edit — сразу за своим sent. Простая
 * склейка [...edited, ...sent] даёт неверный порядок, когда edit-экраны
 * (дрill-down одной стори) чередуются с send-экранами (смена стори).
 */
function screensNewFirst(
  transport: TestBotTransport,
  tgId: number,
): ScreenRecord[] {
  const editsByMessageId = new Map<number, ScreenRecord[]>();
  for (const e of transport.api.editedMessages) {
    if (e.telegramId !== tgId) continue;
    const list = editsByMessageId.get(e.messageId) ?? [];
    list.push(e);
    editsByMessageId.set(e.messageId, list);
  }
  const merged: ScreenRecord[] = [];
  for (const s of transport.api.sentMessages) {
    if (s.telegramId !== tgId) continue;
    merged.push(s);
    merged.push(...(editsByMessageId.get(s.messageId) ?? []));
  }
  return merged.reverse();
}

/** Отштампованный код кнопки с последнего экрана пользователя (Api-запись). */
function pressedCode(
  transport: TestBotTransport,
  tgId: number,
  textContains: string,
): string {
  const screens = screensNewFirst(transport, tgId);
  for (const screen of screens) {
    const btn = screen.keyboard?.rows
      .flat()
      .find((b) => b.text.includes(textContains));
    if (btn) return btn.code;
  }
  throw new Error(
    `Кнопка «${textContains}» не найдена на экранах ${tgId} ` +
      `(перед нажатием открой экран через /start или кнопку).`,
  );
}

/** Callback-пункт главного меню по подстроке текста. */
function findMenuItem(items: MenuButton[], textContains: string): CbMenuButton {
  const item = items.find((i) => i.text.includes(textContains));
  if (!item) {
    const all = items.map((i) => i.text).join(', ');
    throw new Error(`Пункт меню «${textContains}» не найден. Доступны: ${all}`);
  }
  if (item.kind !== 'callback') {
    throw new Error(`Пункт «${textContains}» — не callback-кнопка`);
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
      const menu = await transport.collectMainMenu(guest);
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
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Программы курсов'),
        }),
      );
      const text = response.screen?.text ?? '';
      expect(text).toContain('Курсы');
      expect(text).toContain('Основы программирования');
      expect(text).toContain('Синтаксис');
      expect(text).toContain('Алгоритмика');
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Основы'))).toBe(true);
      expect(btns.some((t) => t.includes('↩️ Главное меню'))).toBe(true);
    });

    test('уровень 1: клик на курс → этапы + модули inline', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Программы курсов'),
        }),
      );
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Основы'),
        }),
      );
      const text = response.screen?.text ?? '';
      expect(text).toContain('Курс: Основы программирования');
      expect(text).toContain('Синтаксис');
      expect(text).toContain('JavaScript Основы');
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Синтаксис'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к курсам'))).toBe(true);
    });

    test('уровень 2: клик на этап → модули + проекты inline', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Программы курсов'),
        }),
      );
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Основы'),
        }),
      );
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Синтаксис'),
        }),
      );
      const text = response.screen?.text ?? '';
      expect(text).toContain('Этап: Синтаксис');
      expect(text).toContain('JavaScript Основы');
      expect(text).toContain('Введение');
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('JavaScript'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к курсу'))).toBe(true);
    });

    test('уровень 3: клик на модуль → проекты + уроки inline', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Программы курсов'),
        }),
      );
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Основы'),
        }),
      );
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Синтаксис'),
        }),
      );
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'JavaScript'),
        }),
      );
      const text = response.screen?.text ?? '';
      expect(text).toContain('Введение');
      expect(text).toContain('Переменные и типы');
      expect(text).toContain('Циклы и функции');
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Введение'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к этапу'))).toBe(true);
    });

    test('уровень 4: клик на проект → уроки + шаги inline', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Программы курсов'),
        }),
      );
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Основы'),
        }),
      );
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Синтаксис'),
        }),
      );
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'JavaScript'),
        }),
      );
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Введение'),
        }),
      );
      const text = response.screen?.text ?? '';
      expect(text).toContain('Проект: Введение');
      expect(text).toContain('Переменные и типы');
      // Тела шагов скрыты — только заголовки уроков и нумерация шагов
      expect(text).not.toContain('```');
      expect(text).not.toContain('function');
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Назад к модулю'))).toBe(true);
    });
  });

  // ── «Потоки курсов»: curious-режим карточки потока ──
  describe('«Потоки курсов» — curious-режим карточки потока', () => {
    test('гость открывает каталог потоков (S01)', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Потоки курсов'),
        }),
      );
      const text = response.screen?.text ?? '';
      expect(text).toContain('Потоки курсов');
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('🟡') || t.includes('🔵'))).toBe(true);
      expect(btns.some((t) => t.includes('↩️ Главное меню'))).toBe(true);
    });

    test('гость → enrollment-поток: карточка без менторских кнопок (S02)', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Потоки курсов'),
        }),
      );
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'JS Core — Поток 1'),
        }),
      );
      const text = response.screen?.text ?? '';
      expect(text).toContain('JS Core');
      expect(text).toContain('Ментор');
      expect(text).toContain('📚 Курс');
      expect(text).not.toContain('Неизвестная команда');
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btns.some((t) => t.includes('Детали'))).toBe(true);
      expect(btns.some((t) => t.includes('Назад к списку'))).toBe(true);
      // Менторские lifecycle-кнопки отсутствуют
      expect(btns.some((t) => t.includes('Запустить'))).toBe(false);
      expect(btns.some((t) => t.includes('Завершить'))).toBe(false);
      expect(btns.some((t) => t.includes('В архив'))).toBe(false);
      // Гостевая кнопка записи (статус enrollment, гость — не студент)
      expect(btns.some((t) => t.includes('Записаться'))).toBe(true);
      // Публичная карточка студентов (Трек 6)
      expect(btns.some((t) => t.includes('Студенты'))).toBe(true);

      // Нажатие на «Студенты» работает (кросс-стори callback)
      const studentsResp = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Студенты'),
        }),
      );
      const studentsText = studentsResp.screen?.text ?? '';
      expect(studentsText).not.toContain('Неизвестная команда');
      expect(studentsText).toContain('Студенты потока');
      expect(studentsText).toContain('Всего:');
    });

    test('гость → active-поток: Программа и Детали видны (S02)', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Потоки курсов'),
        }),
      );
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'JS Core — Поток 2'),
        }),
      );
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btns.some((t) => t.includes('Детали'))).toBe(true);
    });
  });

  // ── «Программы курсов» — drill-up (обратная навигация) ──
  describe('«Программы курсов» — обратная навигация', () => {
    test('drill-down 5 уровней → drill-up 4 уровня обратно', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      const press = (label: string) =>
        transport.handleCallback(
          transport.makeBotContext(tgId, {
            callbackData: pressedCode(transport, tgId, label),
          }),
        );

      await press('Программы курсов');
      await press('Основы');
      await press('Синтаксис');
      await press('JavaScript');
      const l4 = await press('Введение');
      expect(l4.screen?.text).toContain('Проект: Введение');

      // Назад: 4 → 3
      const back3 = await press('Назад к модулю');
      expect(back3.screen?.text).toContain('Модуль: JavaScript');

      // Назад: 3 → 2
      const back2 = await press('Назад к этапу');
      expect(back2.screen?.text).toContain('Синтаксис');

      // Назад: 2 → 1
      const back1 = await press('Назад к курсу');
      expect(back1.screen?.text).toContain('Курс: Основы программирования');

      // Назад: 1 → 0
      const back0 = await press('Назад к курсам');
      expect(back0.screen?.text).toContain('Курсы');
    });

    test('drill-down → назад → другой путь', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      const press = (label: string) =>
        transport.handleCallback(
          transport.makeBotContext(tgId, {
            callbackData: pressedCode(transport, tgId, label),
          }),
        );

      await press('Программы курсов');
      await press('Основы');
      const l2 = await press('Синтаксис');
      expect(l2.screen?.text).toContain('Синтаксис');

      const back1 = await press('Назад к курсу');

      // Другой путь: этап «Алгоритмика» того же курса
      const algoResp = await press('Алгоритмика');
      expect(algoResp.screen?.text).toContain('Алгоритмика');
      expect(back1.screen?.text).toContain('Курс: Основы программирования');
    });

    test('c карточки курса — Главное меню', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Программы курсов'),
        }),
      );
      const mainResp = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Главное меню'),
        }),
      );
      expect(mainResp.screen?.text).toContain('Выберите действие');
    });
  });

  // ── «Потоки курсов» — полный round-trip ──
  describe('«Потоки курсов» — round-trip навигация', () => {
    test('каталог → карточка → программа → назад → детали → назад → каталог', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      const press = (label: string) =>
        transport.handleCallback(
          transport.makeBotContext(tgId, {
            callbackData: pressedCode(transport, tgId, label),
          }),
        );

      const catalog = await press('Потоки курсов');
      expect(catalog.screen?.text).toContain('Потоки курсов');

      const card = await press('JS Core — Поток 1');
      expect(card.screen?.text).toContain('JS Core');

      const program = await press('Программа курса');
      expect(program.screen?.text).toContain('Программа курса');
      expect(program.screen?.text).toContain('📁');

      const backToCard = await press('Назад к потоку');
      expect(backToCard.screen?.text).toContain('JS Core');

      const details = await press('Детали');
      expect(details.screen?.text).toContain('Детали');

      const backAgain = await press('Назад к потоку');
      expect(backAgain.screen?.text).toContain('JS Core');

      const backToCatalog = await press('Назад к списку');
      expect(backToCatalog.screen?.text).toContain('Потоки курсов');
    });

    test('каталог → active-поток → программа → назад → каталог', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      const press = (label: string) =>
        transport.handleCallback(
          transport.makeBotContext(tgId, {
            callbackData: pressedCode(transport, tgId, label),
          }),
        );

      await press('Потоки курсов');
      const card = await press('JS Core — Поток 2');
      expect(card.screen?.text).toContain('Поток 2');

      const program = await press('Программа курса');
      expect(program.screen?.text).toContain('📁');

      await press('Назад к потоку');
      const backCatalog = await press('Назад к списку');
      expect(backCatalog.screen?.text).toContain('Потоки курсов');
    });

    test('каталог → Главное меню', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Потоки курсов'),
        }),
      );
      const mainResp = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: pressedCode(transport, tgId, 'Главное меню'),
        }),
      );
      expect(mainResp.screen?.text).toContain('Выберите действие');
    });

    test('несуществующий поток — экран ошибки', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      // Крафтовый код с АКТУАЛЬНЫМ штампом экрана: по форме валиден,
      // но поток не существует — экран ошибки, без падений
      const stamp = pressedCode(transport, tgId, 'Программы курсов')
        .split(':')
        .pop();
      const response = await transport.handleCallback(
        transport.makeBotContext(tgId, {
          callbackData: `stream:view-stream:view:ffffffff-ffff-ffff-ffff-ffffffffffff:${stamp}`,
        }),
      );
      expect(response.screen?.text).toContain('не найден');
    });
  });

  // ── Сквозной: курсы ↔ потоки ──
  describe('Сквозная навигация: курсы ↔ потоки', () => {
    test('главное меню → курсы → назад → потоки → карточка → назад', async () => {
      const tgId = guest.telegramId;
      await transport.handleStart(transport.makeBotContext(tgId));
      const press = (label: string) =>
        transport.handleCallback(
          transport.makeBotContext(tgId, {
            callbackData: pressedCode(transport, tgId, label),
          }),
        );

      const courses = await press('Программы курсов');
      expect(courses.screen?.text).toContain('Курсы');

      const main1 = await press('Главное меню');
      expect(main1.screen?.text).toContain('Выберите действие');

      // Кнопки меню есть на экране короткого меню — pressedCode их найдёт
      const catalog = await press('Потоки курсов');
      expect(catalog.screen?.text).toContain('Потоки курсов');

      const card = await press('JS Core — Поток 1');
      expect(card.screen?.text).toContain('JS Core');

      const back = await press('Назад к списку');
      expect(back.screen?.text).toContain('Потоки курсов');
    });

    test('handleHelp показывает описания курсов и потоков (notify, ФР-5)', async () => {
      const response = await transport.handleHelp(
        transport.makeBotContext(guest.telegramId),
      );
      const text = response.notify?.text ?? '';
      expect(text).toContain('Как со мной работать');
      expect(text).toContain('Программы курсов');
      expect(text).toContain('Потоки курсов');
      // /help — реплика, экран не захватывает
      expect(response.screen).toBeUndefined();
    });
  });
});
