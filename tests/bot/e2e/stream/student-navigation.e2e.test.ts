import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

// ── Фикстуры ──

const NO_SESSION: SessionData = { activeHandler: null };

// ── Хелперы ──

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

/** Проверяет, что кнопка с текстом есть в клавиатуре */
function hasButton(response: BotResponse, textContains: string): boolean {
  return (
    response.sendMessage?.keyboard?.rows
      .flat()
      .some((b) => b.text.includes(textContains)) ?? false
  );
}

/** Собирает все тексты кнопок в одну строку */
function allButtonTexts(response: BotResponse): string {
  return (
    response.sendMessage?.keyboard?.rows
      .flat()
      .map((b) => b.text)
      .join(' ') ?? ''
  );
}

// ═══════════════════════════════════════════════════════════════════

describe('Навигация студента: хаб → дерево → листание (E2E)', () => {
  let app: TestApp;
  let router: BotRouter;
  let student: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-nav');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    student = (await app.userFacade.getUserByTelegramId(1003))!;

    // Прогреваем студента: завершаем d0, d1 (урок «Переменные и типы»).
    // d2 — текущий (первый шаг урока «Условные операторы»).
    // completed=[d0, d1], текущий=d2.
    await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      student,
      NO_SESSION,
    );
    await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
      student,
      NO_SESSION,
    );
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ──────────────────────────────────────────────
  // Хаб «Моя учёба»
  // ──────────────────────────────────────────────

  test('Хаб: 4 кнопки (Продолжить, Уроки, Прогресс, Покинуть)', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(hubResp);

    const text = hubResp.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');
    expect(text).toContain('Выберите действие');

    expect(hasButton(hubResp, 'Продолжить')).toBe(true);
    expect(hasButton(hubResp, 'Уроки')).toBe(true);
    expect(hasButton(hubResp, 'прогресс')).toBe(true);
    expect(hasButton(hubResp, 'Покинуть поток')).toBe(true);
  });

  // ──────────────────────────────────────────────
  // Сценарий 1: дерево → листание ◀️/▶️ → границы → все «⬅️ Назад»
  // ──────────────────────────────────────────────

  test('Дерево: проекты→уроки→шаги→просмотр→◀️/▶️→назад (сквозной, 10 шагов)', async () => {
    // ── 1: хаб → «📂 Уроки» → проекты
    let resp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(resp);

    const lessonsBtn = findButton(resp, 'Уроки');
    resp = await router.handleCallback(lessonsBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    // Прогресс проекта в кнопках: «📁 Введение (1/2)» — один урок завершён
    expect(allButtonTexts(resp)).toContain('Введение');
    expect(allButtonTexts(resp)).toContain('1/2');

    // ── 2: проект «Введение» → уроки с прогрессом
    const projectBtn = findButton(resp, 'Введение');
    resp = await router.handleCallback(projectBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('Введение');
    const lessonBtns = allButtonTexts(resp);
    expect(lessonBtns).toContain('Переменные и типы');
    expect(lessonBtns).toContain('2/2'); // полностью завершён
    expect(lessonBtns).toContain('Условные операторы');
    expect(lessonBtns).toContain('0/2'); // d2 issued, но не completed

    // ── 3: урок «Переменные и типы» → шаги (оба ✅)
    const lesson0Btn = findButton(resp, 'Переменные и типы');
    resp = await router.handleCallback(lesson0Btn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('Переменные и типы');
    expect(resp.sendMessage?.text).toContain('✅');
    expect(hasButton(resp, 'Шаг 1')).toBe(true);
    expect(hasButton(resp, 'Шаг 2')).toBe(true);

    // ── 4: клик на d0 → просмотр. ◀️ скрыта (первый completed)
    const step0Btn = findButton(resp, 'Шаг 1');
    resp = await router.handleCallback(step0Btn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('Переменная');
    expect(hasButton(resp, '◀️ Назад')).toBe(false);
    expect(hasButton(resp, '▶️ Вперёд')).toBe(true);

    // ── 5: ▶️ d1 — обе стрелки видны
    const fwdBtn = findButton(resp, '▶️ Вперёд');
    resp = await router.handleCallback(fwdBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('Типы данных');
    expect(hasButton(resp, '◀️ Назад')).toBe(true);
    expect(hasButton(resp, '▶️ Вперёд')).toBe(false); // последний completed в этом наборе

    // ── 6: ◀️ d0 обратно
    const backBtn = findButton(resp, '◀️ Назад');
    resp = await router.handleCallback(backBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    expect(resp.sendMessage?.text).toContain('Переменная');

    // ── 7: «⬅️ Назад к уроку» → шаги
    const toLessonBtn = findButton(resp, '⬅️ Назад к уроку');
    resp = await router.handleCallback(toLessonBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    expect(resp.sendMessage?.text).toContain('Переменные и типы');

    // ── 8: «⬅️ Назад к урокам» → уроки проекта
    const toLessonsBtn = findButton(resp, '⬅️ Назад к урокам');
    resp = await router.handleCallback(toLessonsBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    expect(resp.sendMessage?.text).toContain('Переменные и типы');

    // ── 9: «⬅️ Назад к проектам» → проекты
    const toProjectsBtn = findButton(resp, '⬅️ Назад к проектам');
    resp = await router.handleCallback(toProjectsBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    expect(resp.sendMessage?.text).toContain('Условные операторы');

    // ── 10: «⬅️ Назад к учёбе» → хаб
    const toStudyBtn = findButton(resp, '⬅️ Назад к учёбе');
    resp = await router.handleCallback(toStudyBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    expect(resp.sendMessage?.text).toContain('Моя учёба');
    expect(hasButton(resp, 'Продолжить')).toBe(true);
    expect(hasButton(resp, 'Уроки')).toBe(true);
  });

  // ──────────────────────────────────────────────
  // Сценарий 2: «Продолжить» → «Выполнено» → ↩️ меню → дерево к пройденному
  // ──────────────────────────────────────────────

  test('«Продолжить» → «Выполнено» → ↩️ меню → дерево к пройденному уроку (сквозной, 10 шагов)', async () => {
    // ── 1: хаб → «▶️ Продолжить» → текущий шаг d2
    let resp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(resp);

    const continueBtn = findButton(resp, 'Продолжить');
    resp = await router.handleCallback(continueBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    let text = resp.sendMessage?.text ?? '';
    expect(text).toContain('Поток:');
    expect(text).toContain('JS Core');
    expect(text).toContain('Условные операторы');
    expect(text).toContain('📊'); // прогресс-бар

    // ── 2: «✅ Выполнено» → авто-переход на d3
    const completeBtn = findButton(resp, 'Выполнено');
    resp = await router.handleCallback(completeBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    text = resp.sendMessage?.text ?? '';
    // d3 — последний шаг → завершение проекта или потока
    expect(text).toMatch(/Проект|завершён|поздравляем/i);

    // ── 3: ↩️ Главное меню → снова хаб
    const mainMenuBtn = findButton(resp, '↩️ Главное меню');
    await router.handleCallback(mainMenuBtn.code, student, NO_SESSION);

    resp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(resp);

    // ── 4: «📂 Уроки» → проекты
    const lessonsBtn = findButton(resp, 'Уроки');
    resp = await router.handleCallback(lessonsBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    expect(allButtonTexts(resp)).toContain('Введение');

    // ── 5: проект → уроки
    const projectBtn = findButton(resp, 'Введение');
    resp = await router.handleCallback(projectBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    // ── 6: урок «Переменные и типы» (пройденный) → шаги ✅✅
    const lesson0Btn = findButton(resp, 'Переменные и типы');
    resp = await router.handleCallback(lesson0Btn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    text = resp.sendMessage?.text ?? '';
    expect(text).toContain('✅');
    expect(text).toContain('Переменные и типы');

    // ── 7: клик на ✅ d0 → просмотр пройденного (без «Выполнено»)
    const stepD0Btn = findButton(resp, 'Шаг 1');
    resp = await router.handleCallback(stepD0Btn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    text = resp.sendMessage?.text ?? '';
    expect(text).toContain('Переменная');
    expect(hasButton(resp, 'Выполнено')).toBe(false);

    // ── 8: «⬅️ Назад к уроку» → шаги
    const toLessonBtn = findButton(resp, '⬅️ Назад к уроку');
    resp = await router.handleCallback(toLessonBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    expect(resp.sendMessage?.text).toContain('Переменные и типы');

    // ── 9: «⬅️ Назад к урокам» → уроки
    const toLessonsBtn = findButton(resp, '⬅️ Назад к урокам');
    resp = await router.handleCallback(toLessonsBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    expect(resp.sendMessage?.text).toContain('Переменные и типы');

    // ── 10: «⬅️ Назад к учёбе» (с уровня проектов)
    // Сначала назад к проектам
    const toProjectsBtn = findButton(resp, '⬅️ Назад к проектам');
    resp = await router.handleCallback(toProjectsBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);
    // Потом к учёбе
    const toStudyBtn = findButton(resp, '⬅️ Назад к учёбе');
    resp = await router.handleCallback(toStudyBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('Моя учёба');
  });

  // ──────────────────────────────────────────────
  // Атомарный: ✅-шаги завершённого урока — обе кнопки
  // ──────────────────────────────────────────────

  test('✅-шаги завершённого урока — обе кнопки видны', async () => {
    const lessonResp = await router.handleCallback(
      'stream:learning:my-study:lesson:c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(lessonResp);

    const text = lessonResp.sendMessage?.text ?? '';
    expect(text).toContain('✅');
    expect(text).toContain('Переменные и типы');

    expect(hasButton(lessonResp, 'Шаг 1')).toBe(true);
    expect(hasButton(lessonResp, 'Шаг 2')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════

/**
 * ◀️/▶️ через уроки: отдельный блок с тремя completed шагами (d0,d1,d2).
 * Проверяет, что листание переходит между уроками.
 */
describe('Навигация студента: ◀️/▶️ через уроки (E2E)', () => {
  let app: TestApp;
  let router: BotRouter;
  let student: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-nav-cross-lesson');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    student = (await app.userFacade.getUserByTelegramId(1003))!;

    // completed=[d0,d1,d2], текущий=d3 — три completed в двух уроках
    await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      student,
      NO_SESSION,
    );
    await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
      student,
      NO_SESSION,
    );
    await router.handleCallback(
      'stream:learning:complete:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
      student,
      NO_SESSION,
    );
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('◀️/▶️ листает через уроки: d0→▶️d1→▶️d2 (из c0 в c1)→◀️d1', async () => {
    // Начинаем с d0
    let resp = await router.handleCallback(
      'stream:learning:my-study:view:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('Переменная'); // d0
    expect(hasButton(resp, '◀️ Назад')).toBe(false);
    expect(hasButton(resp, '▶️ Вперёд')).toBe(true);

    // ▶️ d1 — тот же урок
    const fwdBtn = findButton(resp, '▶️ Вперёд');
    resp = await router.handleCallback(fwdBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('Типы данных'); // d1
    expect(hasButton(resp, '◀️ Назад')).toBe(true);
    expect(hasButton(resp, '▶️ Вперёд')).toBe(true);

    // ▶️ d2 — ПЕРЕХОД В ДРУГОЙ УРОК («Условные операторы»)
    const fwdBtn2 = findButton(resp, '▶️ Вперёд');
    resp = await router.handleCallback(fwdBtn2.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('if'); // d2
    expect(resp.sendMessage?.text).toContain('Условные операторы'); // другой урок!
    expect(hasButton(resp, '◀️ Назад')).toBe(true);
    expect(hasButton(resp, '▶️ Вперёд')).toBe(false); // последний completed

    // ◀️ d1 обратно
    const backBtn = findButton(resp, '◀️ Назад');
    resp = await router.handleCallback(backBtn.code, student, NO_SESSION);
    assertBotResponseValid(resp);

    expect(resp.sendMessage?.text).toContain('Типы данных'); // вернулись в d1
    expect(resp.sendMessage?.text).toContain('Переменные и типы'); // вернулись в c0
  });
});

// ═══════════════════════════════════════════════════════════════════

describe('Навигация студента: выход из потока (E2E)', () => {
  let app: TestApp;
  let router: BotRouter;
  let student: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-nav-leave');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    student = (await app.userFacade.getUserByTelegramId(1003))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('Хаб → «🚪 Покинуть поток» → confirm-диалог', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(hubResp);

    const leaveBtn = findButton(hubResp, 'Покинуть поток');
    const confirmResp = await router.handleCallback(
      leaveBtn.code,
      student,
      NO_SESSION,
    );
    assertBotResponseValid(confirmResp);

    const text = confirmResp.sendMessage?.text ?? '';
    expect(text).toContain('покинуть');
    // Confirm-диалог не показывает название потока
    expect(text).toContain('Покинуть поток?');

    expect(hasButton(confirmResp, 'Да, покинуть')).toBe(true);
    expect(hasButton(confirmResp, 'Отмена')).toBe(true);
  });

  test('Подтверждение → студент удалён из потока', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );

    const leaveBtn = findButton(hubResp, 'Покинуть поток');
    const confirmResp = await router.handleCallback(
      leaveBtn.code,
      student,
      NO_SESSION,
    );

    const yesBtn = findButton(confirmResp, 'Да, покинуть');
    const leaveResp = await router.handleCallback(
      yesBtn.code,
      student,
      NO_SESSION,
    );
    assertBotResponseValid(leaveResp);

    const text = leaveResp.sendMessage?.text ?? '';
    expect(text).toContain('покинули');

    // Проверяем что студент переведён в abandoned
    const studentAfter = await app.streamModule.execute(
      'get-student-by-user',
      { userId: student.uuid },
      student.uuid,
    );
    expect(studentAfter.status).toBe('abandoned');

    expect(hasButton(leaveResp, '↩️ Главное меню')).toBe(true);
  });

  test('«Отмена» в confirm-диалоге → возврат в хаб', async () => {
    // Доходим до confirm-диалога через active студента
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(hubResp);

    const leaveBtn = findButton(hubResp, 'Покинуть поток');
    const confirmResp = await router.handleCallback(
      leaveBtn.code,
      student,
      NO_SESSION,
    );

    // «Отмена»
    const cancelBtn = findButton(confirmResp, 'Отмена');
    const cancelResp = await router.handleCallback(
      cancelBtn.code,
      student,
      NO_SESSION,
    );
    assertBotResponseValid(cancelResp);

    expect(cancelResp.sendMessage?.text).toContain('Моя учёба');
  });
});

// ═══════════════════════════════════════════════════════════════════

describe('Завершивший студент: хаб без Продолжить/Уроки (E2E)', () => {
  let app: TestApp;
  let router: BotRouter;
  let advancedUser: User;
  let notAdvancedUser: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-nav-finished');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    advancedUser = (await app.userFacade.getUserByTelegramId(1007))!;
    notAdvancedUser = (await app.userFacade.getUserByTelegramId(1008))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('Advanced студент: хаб без «Продолжить» и «📂 Уроки»', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      advancedUser,
      NO_SESSION,
    );
    assertBotResponseValid(hubResp);

    const text = hubResp.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');

    expect(hasButton(hubResp, 'Продолжить')).toBe(false);
    expect(hasButton(hubResp, 'Уроки')).toBe(false);
    // Прогресс и Покинуть — доступны
    const btnTexts = allButtonTexts(hubResp);
    expect(btnTexts).toContain('прогресс');
    expect(btnTexts).toContain('Покинуть');
  });

  test('Not-advanced студент: хаб без «Продолжить» и «📂 Уроки»', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      notAdvancedUser,
      NO_SESSION,
    );
    assertBotResponseValid(hubResp);

    const text = hubResp.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');

    expect(hasButton(hubResp, 'Продолжить')).toBe(false);
    expect(hasButton(hubResp, 'Уроки')).toBe(false);
    const btnTexts2 = allButtonTexts(hubResp);
    expect(btnTexts2).toContain('прогресс');
    expect(btnTexts2).toContain('Покинуть');
  });
});
