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

    // Прогреваем студента: завершаем d0, d1 (урок 1), d2 (урок 2)
    // Шаги: d0,d1 = урок «Переменные и типы», d2,d3 = урок «Условные операторы»
    // После: completed=[d0,d1,d2], текущий=d3
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
  // «Продолжить» → текущий шаг
  // ──────────────────────────────────────────────

  test('«Продолжить» → шаг d3 с прогресс-баром', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );

    const continueBtn = findButton(hubResp, 'Продолжить');
    const stepResp = await router.handleCallback(
      continueBtn.code,
      student,
      NO_SESSION,
    );
    assertBotResponseValid(stepResp);

    const text = stepResp.sendMessage?.text ?? '';
    expect(text).toContain('Поток:');
    expect(text).toContain('JS Core');
    expect(text).toContain('Урок:');
    expect(text).toContain('Условные операторы');
    // Прогресс-бар
    expect(text).toContain('📊');

    expect(hasButton(stepResp, 'Выполнено')).toBe(true);
    expect(hasButton(stepResp, 'Мой прогресс')).toBe(true);
    expect(hasButton(stepResp, '↩️ Главное меню')).toBe(true);
  });

  // ──────────────────────────────────────────────
  // Дерево: проекты → уроки → шаги → просмотр
  // ──────────────────────────────────────────────

  test('Дерево: проекты — кнопки с прогрессом', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );

    const lessonsBtn = findButton(hubResp, 'Уроки');
    const projectsResp = await router.handleCallback(
      lessonsBtn.code,
      student,
      NO_SESSION,
    );
    assertBotResponseValid(projectsResp);

    const text = projectsResp.sendMessage?.text ?? '';
    expect(text).toContain('Уроки');
    expect(text).toContain('Выберите проект');

    // Прогресс в тексте кнопок
    const btnTexts = allButtonTexts(projectsResp);
    // Кнопка «📁 Введение (2/2)» — оба урока в проекте имеют ≥1 completed/issued шаг
    expect(btnTexts).toContain('Введение');

    expect(hasButton(projectsResp, '⬅️ Назад к учёбе')).toBe(true);
  });

  test('Дерево: проект → уроки — кнопки с прогрессом', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );
    const lessonsBtn = findButton(hubResp, 'Уроки');
    await router.handleCallback(lessonsBtn.code, student, NO_SESSION);

    // Открываем проект «Введение» (индекс 1)
    const projectResp = await router.handleCallback(
      'stream:learning:my-study:project:1',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(projectResp);

    const text = projectResp.sendMessage?.text ?? '';
    expect(text).toContain('Уроки');
    expect(text).toContain('Введение');
    expect(text).toContain('Выберите урок');

    // Прогресс в кнопках
    const btnTexts = allButtonTexts(projectResp);
    expect(btnTexts).toContain('Переменные и типы');
    // Урок «Переменные и типы»: 2/2 завершено
    expect(btnTexts).toContain('2/2');
    expect(btnTexts).toContain('Условные операторы');
    // Урок «Условные операторы»: 1/2 (d2 завершён, d3 текущий)
    expect(btnTexts).toContain('1/2');

    expect(hasButton(projectResp, '⬅️ Назад к проектам')).toBe(true);
  });

  test('Дерево: урок → шаги с маркерами ✅/▶️ и кнопками', async () => {
    // Заходим в урок «Условные операторы» (c1)
    const lessonResp = await router.handleCallback(
      'stream:learning:my-study:lesson:c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(lessonResp);

    const text = lessonResp.sendMessage?.text ?? '';
    expect(text).toContain('Уроки');
    expect(text).toContain('Условные операторы');
    expect(text).toContain('✅'); // Шаг 3 (d2) — завершён
    expect(text).toContain('▶️'); // Шаг 4 (d3) — текущий

    // Кнопки для завершённого и текущего шагов
    expect(hasButton(lessonResp, 'Шаг 3')).toBe(true);
    expect(hasButton(lessonResp, 'Шаг 4')).toBe(true);

    expect(hasButton(lessonResp, '⬅️ Назад к урокам')).toBe(true);
  });

  test('Дерево: ✅-шаги обоих уроков — все кнопки', async () => {
    // Открываем урок «Переменные и типы» (c0) — оба шага завершены
    const lessonResp = await router.handleCallback(
      'stream:learning:my-study:lesson:c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(lessonResp);

    const text = lessonResp.sendMessage?.text ?? '';
    expect(text).toContain('✅');
    expect(text).toContain('Переменные и типы');

    // Оба шага — кнопки
    expect(hasButton(lessonResp, 'Шаг 1')).toBe(true);
    expect(hasButton(lessonResp, 'Шаг 2')).toBe(true);
  });

  test('Просмотр завершённого шага: контент + список шагов + ◀️/▶️', async () => {
    const viewResp = await router.handleCallback(
      'stream:learning:my-study:view:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(viewResp);

    const text = viewResp.sendMessage?.text ?? '';
    expect(text).toContain('Шаг 1');
    expect(text).toContain('Переменная');
    expect(text).toContain('📊');
    // Список шагов внизу
    expect(text).toContain('✅');

    // Кнопки для completed шага
    expect(hasButton(viewResp, '⬅️ Назад к уроку')).toBe(true);
    expect(hasButton(viewResp, '↩️ Главное меню')).toBe(true);
    expect(hasButton(viewResp, 'Выполнено')).toBe(false);
  });

  // ──────────────────────────────────────────────
  // Листание ◀️/▶️
  // ──────────────────────────────────────────────

  test('◀️/▶️: навигация по completed шагам', async () => {
    // Начинаем с d0 (первый completed)
    const viewResp = await router.handleCallback(
      'stream:learning:my-study:view:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      student,
      NO_SESSION,
    );
    assertBotResponseValid(viewResp);

    // ◀️ скрыта (первый), ▶️ видна
    expect(hasButton(viewResp, '◀️ Назад')).toBe(false);
    expect(hasButton(viewResp, '▶️ Вперёд')).toBe(true);

    // ▶️ → d1
    const nextBtn = findButton(viewResp, '▶️ Вперёд');
    const d1Resp = await router.handleCallback(nextBtn.code, student, NO_SESSION);
    assertBotResponseValid(d1Resp);

    const d1Text = d1Resp.sendMessage?.text ?? '';
    expect(d1Text).toContain('Шаг 2');
    expect(d1Text).toContain('Типы данных');

    // Обе видны на промежуточном
    expect(hasButton(d1Resp, '◀️ Назад')).toBe(true);
    expect(hasButton(d1Resp, '▶️ Вперёд')).toBe(true);

    // ▶️ → d2 (следующий урок)
    const nextBtn2 = findButton(d1Resp, '▶️ Вперёд');
    const d2Resp = await router.handleCallback(nextBtn2.code, student, NO_SESSION);
    assertBotResponseValid(d2Resp);

    const d2Text = d2Resp.sendMessage?.text ?? '';
    expect(d2Text).toContain('Шаг 3');
    expect(d2Text).toContain('if');

    // На последнем completed ▶️ скрыта
    expect(hasButton(d2Resp, '◀️ Назад')).toBe(true);
    expect(hasButton(d2Resp, '▶️ Вперёд')).toBe(false);

    // ◀️ → d1
    const backBtn = findButton(d2Resp, '◀️ Назад');
    const backResp = await router.handleCallback(backBtn.code, student, NO_SESSION);
    assertBotResponseValid(backResp);
    expect(backResp.sendMessage?.text).toContain('Типы данных');
  });

  // ──────────────────────────────────────────────
  // Кнопки «⬅️ Назад» на всех уровнях
  // ──────────────────────────────────────────────

  test('«⬅️ Назад к уроку» → список шагов', async () => {
    const viewResp = await router.handleCallback(
      'stream:learning:my-study:view:e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1:d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
      student,
      NO_SESSION,
    );

    const backBtn = findButton(viewResp, '⬅️ Назад к уроку');
    const lessonResp = await router.handleCallback(backBtn.code, student, NO_SESSION);
    assertBotResponseValid(lessonResp);

    const text = lessonResp.sendMessage?.text ?? '';
    // Кнопка «⬅️ Назад к уроку» возвращает в урок c0 («Переменные и типы»),
    // так как d0 находится в уроке c0
    expect(text).toContain('Переменные и типы');
    expect(text).toContain('✅');
  });

  test('«⬅️ Назад к урокам» → список уроков', async () => {
    const lessonResp = await router.handleCallback(
      'stream:learning:my-study:lesson:c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
      student,
      NO_SESSION,
    );

    const backBtn = findButton(lessonResp, '⬅️ Назад к урокам');
    const backResp = await router.handleCallback(backBtn.code, student, NO_SESSION);
    assertBotResponseValid(backResp);

    const text = backResp.sendMessage?.text ?? '';
    expect(text).toContain('Введение');
    expect(text).toContain('Выберите урок');

    const btnTexts = allButtonTexts(backResp);
    expect(btnTexts).toContain('Переменные и типы');
    expect(btnTexts).toContain('Условные операторы');
  });

  test('«⬅️ Назад к проектам» → список проектов', async () => {
    const projectResp = await router.handleCallback(
      'stream:learning:my-study:project:1',
      student,
      NO_SESSION,
    );

    const backBtn = findButton(projectResp, '⬅️ Назад к проектам');
    const backResp = await router.handleCallback(backBtn.code, student, NO_SESSION);
    assertBotResponseValid(backResp);

    const text = backResp.sendMessage?.text ?? '';
    expect(text).toContain('Выберите проект');

    const btnTexts = allButtonTexts(backResp);
    expect(btnTexts).toContain('Введение');
  });

  test('«⬅️ Назад к учёбе» → хаб', async () => {
    const hubResp = await router.handleCallback(
      'stream:learning:my-study',
      student,
      NO_SESSION,
    );
    const lessonsBtn = findButton(hubResp, 'Уроки');
    const projectsResp = await router.handleCallback(lessonsBtn.code, student, NO_SESSION);

    const backBtn = findButton(projectsResp, '⬅️ Назад к учёбе');
    const backResp = await router.handleCallback(backBtn.code, student, NO_SESSION);
    assertBotResponseValid(backResp);

    expect(backResp.sendMessage?.text).toContain('Моя учёба');
    expect(hasButton(backResp, 'Продолжить')).toBe(true);
    expect(hasButton(backResp, 'Уроки')).toBe(true);
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
    const confirmResp = await router.handleCallback(leaveBtn.code, student, NO_SESSION);
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
    const confirmResp = await router.handleCallback(leaveBtn.code, student, NO_SESSION);

    const yesBtn = findButton(confirmResp, 'Да, покинуть');
    const leaveResp = await router.handleCallback(yesBtn.code, student, NO_SESSION);
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
