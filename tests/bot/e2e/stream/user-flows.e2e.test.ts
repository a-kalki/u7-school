import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

// ── Фикстуры ──

const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';
const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const STUDENT_ID = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

// ── Хелперы ──

const NO_SESSION: SessionData = { activeHandler: null };

/** Находит кнопку в клавиатуре ответа по вхождению подстроки в текст */
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

/** Находит пункт главного меню по тексту */
function findMenuItem(
  items: { text: string; action: string }[],
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

describe('Сквозные пользовательские сценарии (E2E)', () => {
  // ────────────────────────────────────────────────
  // Гость: каталог → карточка потока → программа → назад к потоку → назад к списку
  // ────────────────────────────────────────────────
  describe('Гость', () => {
    let app: TestApp;
    let router: BotRouter;
    let guest: User;

    beforeAll(async () => {
      app = await createTestApp('e2e-guest');
      const streamController = new StreamController(app.streamModule);
      streamController.init(app.apiApp);
      router = new BotRouter([streamController]);
      guest = (await app.userFacade.getUserByTelegramId(1001))!;
    });

    afterAll(async () => {
      await app.cleanup();
    });

    test('главное меню: есть «Наши потоки», нет «Моя учёба» и «Создать поток»', async () => {
      const menu = await router.collectMainMenu(guest);

      expect(menu.some((i) => i.text.includes('Наши потоки'))).toBe(true);
      expect(menu.some((i) => i.text.includes('Моя учёба'))).toBe(false);
      expect(menu.some((i) => i.text.includes('Создать поток'))).toBe(false);
    });

    test('«Наши потоки» → витрина с потоками', async () => {
      const menu = await router.collectMainMenu(guest);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');

      const response = await router.handleCallback(
        catalogBtn.action,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(response);

      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Потоки школы');

      const btnTexts =
        response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('🟢'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('🔵'))).toBe(true);
    });

    test('каталог → нажатие на поток → карточка потока', async () => {
      // Открываем каталог
      const menu = await router.collectMainMenu(guest);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');
      const catalogResp = await router.handleCallback(
        catalogBtn.action,
        guest,
        NO_SESSION,
      );

      // Нажимаем на первый поток (enrollment) — извлекаем code из кнопки
      const streamBtn = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(
        streamBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(viewResp);

      const text = viewResp.sendMessage?.text ?? '';
      expect(text).toContain('JS Core');
      expect(text).toContain('Ментор');
      expect(text).not.toContain('Неизвестная команда');

      // На enrollment должны быть кнопки для гостя
      const btnTexts =
        viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
    });

    test('карточка → «Программа курса» → проекты и уроки', async () => {
      // Доходим до карточки потока
      const menu = await router.collectMainMenu(guest);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');
      const catalogResp = await router.handleCallback(
        catalogBtn.action,
        guest,
        NO_SESSION,
      );
      const streamBtn = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(
        streamBtn.code,
        guest,
        NO_SESSION,
      );

      // Нажимаем «Программа курса»
      const programBtn = findButton(viewResp, 'Программа курса');
      const programResp = await router.handleCallback(
        programBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(programResp);

      const text = programResp.sendMessage?.text ?? '';
      expect(text).toContain('Программа курса');
      expect(text).toContain('Введение');
      expect(text).toContain('Переменные и типы');

      const btnTexts =
        programResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Назад к потоку'))).toBe(true);
    });

    test('программа → «Назад к потоку» → снова карточка', async () => {
      // Доходим до программы
      const menu = await router.collectMainMenu(guest);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');
      const catalogResp = await router.handleCallback(
        catalogBtn.action,
        guest,
        NO_SESSION,
      );
      const streamBtn = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(
        streamBtn.code,
        guest,
        NO_SESSION,
      );
      const programBtn = findButton(viewResp, 'Программа курса');
      const programResp = await router.handleCallback(
        programBtn.code,
        guest,
        NO_SESSION,
      );

      // «Назад к потоку»
      const backToStreamBtn = findButton(programResp, 'Назад к потоку');
      const backResp = await router.handleCallback(
        backToStreamBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(backResp);

      const text = backResp.sendMessage?.text ?? '';
      expect(text).toContain('JS Core');
      expect(text).not.toContain('Неизвестная команда');
    });

    test('карточка → «Назад к списку» → снова каталог', async () => {
      // Доходим до карточки
      const menu = await router.collectMainMenu(guest);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');
      const catalogResp = await router.handleCallback(
        catalogBtn.action,
        guest,
        NO_SESSION,
      );
      const streamBtn = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(
        streamBtn.code,
        guest,
        NO_SESSION,
      );

      // «Назад к списку»
      const backBtn = findButton(viewResp, 'Назад к списку');
      const backResp = await router.handleCallback(
        backBtn.code,
        guest,
        NO_SESSION,
      );
      assertBotResponseValid(backResp);

      expect(backResp.sendMessage?.text).toContain('Потоки школы');
      expect(backResp.sendMessage?.text).not.toContain('Неизвестная команда');
    });
  });

  // ────────────────────────────────────────────────
  // Кандидат: каталог → карточка → записаться → моя учёба
  // ────────────────────────────────────────────────
  describe('Кандидат: запись на поток', () => {
    let app: TestApp;
    let router: BotRouter;
    let candidate: User;

    beforeAll(async () => {
      app = await createTestApp('e2e-candidate');
      const streamController = new StreamController(app.streamModule);
      streamController.init(app.apiApp);
      router = new BotRouter([streamController]);
      candidate = (await app.userFacade.getUserByTelegramId(1002))!;
    });

    afterAll(async () => {
      await app.cleanup();
    });

    test('каталог → карточка → «Записаться» → «Моя учёба»', async () => {
      const menu = await router.collectMainMenu(candidate);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');
      const catalogResp = await router.handleCallback(
        catalogBtn.action,
        candidate,
        NO_SESSION,
      );
      const streamBtn = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(
        streamBtn.code,
        candidate,
        NO_SESSION,
      );

      // Нажимаем «Записаться»
      const enrollBtn = findButton(viewResp, 'Записаться');
      const enrollResp = await router.handleCallback(
        enrollBtn.code,
        candidate,
        NO_SESSION,
      );
      assertBotResponseValid(enrollResp);

      // После записи — делегирование в «Моя учёба»:
      // основной sendMessage + делегированный sendMessage
      const allTexts = [
        enrollResp.sendMessage?.text ?? '',
        ...(enrollResp.sendMessages ?? []).map((m) => m.text),
      ].join(' ');

      expect(allTexts).toContain('успешно записаны');
      expect(allTexts).toContain('JS Core');
      expect(allTexts).toContain('Моя учёба');
    });

    test('после записи — студент найден в потоке', async () => {
      const studentRecord = await app.streamModule.execute(
        'get-student-by-user',
        { userId: candidate.uuid },
        candidate.uuid,
      );
      expect(studentRecord).toBeDefined();
      expect(studentRecord.status).toBe('active');
      expect(studentRecord.streamId).toBe(ENROLLMENT_ID);
    });
  });

  // ────────────────────────────────────────────────
  // Студент: главное меню → «Моя учёба» → видит текущий шаг
  // ────────────────────────────────────────────────
  describe('Студент', () => {
    let app: TestApp;
    let router: BotRouter;
    let student: User;

    beforeAll(async () => {
      app = await createTestApp('e2e-student');
      const streamController = new StreamController(app.streamModule);
      streamController.init(app.apiApp);
      router = new BotRouter([streamController]);
      student = (await app.userFacade.getUserByTelegramId(1003))!;
    });

    afterAll(async () => {
      await app.cleanup();
    });

    test('главное меню: есть «Моя учёба»', async () => {
      const menu = await router.collectMainMenu(student);
      expect(menu.some((i) => i.text.includes('Моя учёба'))).toBe(true);
    });

    test('«Моя учёба» → текущий шаг и кнопки', async () => {
      const menu = await router.collectMainMenu(student);
      const studyBtn = findMenuItem(menu, 'Моя учёба');

      const response = await router.handleCallback(
        studyBtn.action,
        student,
        NO_SESSION,
      );
      assertBotResponseValid(response);

      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Моя учёба');
      expect(text).toContain('JS Core');
      expect(text).toContain('Текущее задание');
      expect(text).not.toContain('Неизвестная команда');

      const btnTexts =
        response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
    });

    test('«Выполнено» → клавиатура следующего шага (без «Шаг выполнен»)', async () => {
      const menu = await router.collectMainMenu(student);
      const studyBtn = findMenuItem(menu, 'Моя учёба');
      const studyResp = await router.handleCallback(
        studyBtn.action,
        student,
        NO_SESSION,
      );

      // Нажимаем «Выполнено»
      const completeBtn = findButton(studyResp, 'Выполнено');
      const completeResp = await router.handleCallback(
        completeBtn.code,
        student,
        NO_SESSION,
      );
      assertBotResponseValid(completeResp);

      const text = completeResp.sendMessage?.text ?? '';
      // Получаем клавиатуру следующего шага, а не сообщение «Шаг выполнен»
      expect(text).toContain('Моя учёба');
      expect(text).toContain('Текущее задание');
      expect(text).not.toContain('Шаг выполнен');

      const btnTexts =
        completeResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
    });

    test('полный проход: завершить последний шаг урока → поздравление + «Начать следующий урок» → новый урок', async () => {
      // Фикстура: студент на шаге d1 (последний шаг урока «Переменные и типы»)
      // Используем прямой вызов complete с известными ID
      const completeResp = await router.handleCallback(
        'stream:learning:complete:f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
        student,
        NO_SESSION,
      );
      assertBotResponseValid(completeResp);

      // Поздравление и кнопка «Начать следующий урок»
      const text1 = completeResp.sendMessage?.text ?? '';
      expect(text1).toContain('завершён');

      const nextLessonBtn = findButton(completeResp, 'Начать следующий урок');

      // Нажимаем «Начать следующий урок»
      const nextResp = await router.handleCallback(
        nextLessonBtn.code,
        student,
        NO_SESSION,
      );
      assertBotResponseValid(nextResp);

      const text2 = nextResp.sendMessage?.text ?? '';
      expect(text2).toContain('Моя учёба');
      expect(text2).toContain('Текущее задание');

      const btnTexts =
        nextResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
    });
  });

  // ────────────────────────────────────────────────
  // Ментор: главное меню → каталог → карточка → студенты → детали → назад
  // ────────────────────────────────────────────────
  describe('Ментор', () => {
    let app: TestApp;
    let router: BotRouter;
    let mentor: User;

    beforeAll(async () => {
      app = await createTestApp('e2e-mentor');
      const streamController = new StreamController(app.streamModule);
      streamController.init(app.apiApp);
      router = new BotRouter([streamController]);
      mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    });

    afterAll(async () => {
      await app.cleanup();
    });

    test('главное меню: есть «Наши потоки» и «Создать поток»', async () => {
      const menu = await router.collectMainMenu(mentor);

      expect(menu.some((i) => i.text.includes('Наши потоки'))).toBe(true);
      expect(menu.some((i) => i.text.includes('Создать поток'))).toBe(true);
      expect(menu.some((i) => i.text.includes('Моя учёба'))).toBe(false);
    });

    test('каталог → карточка enrollment-потока (менторские кнопки)', async () => {
      const menu = await router.collectMainMenu(mentor);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');
      const catalogResp = await router.handleCallback(
        catalogBtn.action,
        mentor,
        NO_SESSION,
      );
      const streamBtn = findButton(catalogResp, '🟢');
      const viewResp = await router.handleCallback(
        streamBtn.code,
        mentor,
        NO_SESSION,
      );
      assertBotResponseValid(viewResp);

      const text = viewResp.sendMessage?.text ?? '';
      expect(text).toContain('JS Core');
      expect(text).not.toContain('Неизвестная команда');

      // Ментор на своём enrollment видит менторские кнопки
      const btnTexts =
        viewResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
      expect(btnTexts.some((t) => t.includes('В архив'))).toBe(true);
    });

    test('карточка active-потока → «Студенты» → список', async () => {
      const menu = await router.collectMainMenu(mentor);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');
      const catalogResp = await router.handleCallback(
        catalogBtn.action,
        mentor,
        NO_SESSION,
      );
      // Берем активный поток (второй)
      const activeBtn = findButton(catalogResp, '🔵');
      const viewResp = await router.handleCallback(
        activeBtn.code,
        mentor,
        NO_SESSION,
      );

      // «Студенты»
      const studentsBtn = findButton(viewResp, 'Студенты');
      const studentsResp = await router.handleCallback(
        studentsBtn.code,
        mentor,
        NO_SESSION,
      );
      assertBotResponseValid(studentsResp);

      const text = studentsResp.sendMessage?.text ?? '';
      expect(text).toContain('Студенты потока');
      expect(text).not.toContain('Неизвестная команда');

      // Должны быть кнопки со студентами
      const btnTexts =
        studentsResp.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ??
        [];
      expect(btnTexts.length).toBeGreaterThan(0);
    });

    test('список студентов → детали студента → «Назад к списку»', async () => {
      // Доходим до списка студентов
      const menu = await router.collectMainMenu(mentor);
      const catalogBtn = findMenuItem(menu, 'Наши потоки');
      const catalogResp = await router.handleCallback(
        catalogBtn.action,
        mentor,
        NO_SESSION,
      );
      const activeBtn = findButton(catalogResp, '🔵');
      const viewResp = await router.handleCallback(
        activeBtn.code,
        mentor,
        NO_SESSION,
      );
      const studentsBtn = findButton(viewResp, 'Студенты');
      const studentsResp = await router.handleCallback(
        studentsBtn.code,
        mentor,
        NO_SESSION,
      );

      // Нажимаем на первого студента (по проценту прогресса)
      const studentRow = studentsResp.sendMessage?.keyboard?.rows[0];
      expect(studentRow).toBeDefined();
      const studentBtn = studentRow![0]!;
      const detailResp = await router.handleCallback(
        studentBtn.code,
        mentor,
        NO_SESSION,
      );
      assertBotResponseValid(detailResp);

      const text = detailResp.sendMessage?.text ?? '';
      expect(text).not.toContain('Неизвестная команда');
      // В деталях студента должно быть имя
      expect(text.length).toBeGreaterThan(0);

      // «Назад к списку»
      const backBtn = findButton(detailResp, 'Назад к списку');
      const backResp = await router.handleCallback(
        backBtn.code,
        mentor,
        NO_SESSION,
      );
      assertBotResponseValid(backResp);
      expect(backResp.sendMessage?.text).toContain('Студенты потока');
      expect(backResp.sendMessage?.text).not.toContain('Неизвестная команда');
    });
  });
});
