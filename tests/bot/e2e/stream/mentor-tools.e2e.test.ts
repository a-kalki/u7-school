import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type {
  BotResponse,
  CbMainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

// ═══════════════════════════════════════════════════════════════════
// Константы фикстур
// ═══════════════════════════════════════════════════════════════════

/** Поток Syntax (active), ментор = 444... */
const SYNTAX_STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

/** Активный студент f0 в потоке Syntax */
const STUDENT_ACTIVE = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

/** Advanced студент f1 */
const STUDENT_ADVANCED = 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1';

// ═══════════════════════════════════════════════════════════════════
// Хелперы
// ═══════════════════════════════════════════════════════════════════

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
      `Кнопка с текстом «${textContains}» не найдена. Доступны: ${allTexts}`,
    );
  }
  return btn;
}

function hasButton(response: BotResponse, textContains: string): boolean {
  return (
    response.sendMessage?.keyboard?.rows
      .flat()
      .some((b) => b.text.includes(textContains)) ?? false
  );
}

function allButtonTexts(response: BotResponse): string {
  return (
    response.sendMessage?.keyboard?.rows
      .flat()
      .map((b) => b.text)
      .join(' ') ?? ''
  );
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

function allText(response: BotResponse): string {
  return [
    response.sendMessage?.text ?? '',
    ...(response.sendMessages ?? []).map((m) => m.text),
  ].join(' ');
}

// ═══════════════════════════════════════════════════════════════════
// Сценарий 1: Полный сквозной путь ментора
// ═══════════════════════════════════════════════════════════════════

describe('E2E: Путь ментора — полный сквозной', () => {
  let app: TestApp;
  let router: UiApp;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-mentor-full');
    const streamController = new StreamController();
    streamController.init(app.apiApp, undefined as never);
    router = new UiApp([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('Главное меню → подменю → Мои потоки → S02m → Студенты → S08 → Назад', async () => {
    // ── 1: Главное меню содержит «Инструменты ментора»
    const menu = (await router.collectMainMenu(mentor)) as CbMainMenuAction[];
    const mentorItem = findMenuItem(menu, 'Инструменты ментора');

    // ── 2: Подменю «Инструменты ментора»
    const submenuResp = await router.handleCallback(
      mentorItem.action,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(submenuResp);

    expect(submenuResp.sendMessage?.text).toContain('Инструменты ментора');
    expect(hasButton(submenuResp, 'Мои потоки')).toBe(true);
    expect(hasButton(submenuResp, 'Создать поток')).toBe(true);

    // ── 3: «Мои потоки» → список (потоки в кнопках, не в тексте)
    const myStreamsBtn = findButton(submenuResp, 'Мои потоки');
    const streamsResp = await router.handleCallback(
      myStreamsBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(streamsResp);

    expect(streamsResp.sendMessage?.text).toContain('Мои потоки');
    expect(hasButton(streamsResp, 'JS Core')).toBe(true);

    // ── 4: Клик по потоку «JS Core — Поток 2» → S02m (менторский вид)
    const streamBtn = findButton(streamsResp, 'Поток 2');
    const s02mResp = await router.handleCallback(
      streamBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(s02mResp);

    const s02mText = s02mResp.sendMessage?.text ?? '';
    expect(s02mText).toContain('JS Core');
    expect(hasButton(s02mResp, 'Программа')).toBe(true);
    expect(hasButton(s02mResp, 'Студенты')).toBe(true);

    // ── 5: «👥 Студенты» → S07 (маркеры + сводка + кнопки действий)
    const studentsBtn = findButton(s02mResp, 'Студенты');
    const s07Resp = await router.handleCallback(
      studentsBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(s07Resp);

    const s07Text = s07Resp.sendMessage?.text ?? '';
    expect(s07Text).toContain('Студенты');
    expect(s07Text).toContain('Всего');

    const s07Buttons = allButtonTexts(s07Resp);
    expect(s07Buttons).toContain('Студент');
    // Маркеры — студент f0 с 0% при staled шагах → 🛑 (critical)
    expect(s07Buttons).toContain('⛔');
    expect(s07Buttons).toContain('✅');
    expect(s07Buttons).toContain('⛔');

    // ── 6: Клик по имени студента → S08 (карточка)
    const studentBtn = findButton(s07Resp, 'Студент');
    const s08Resp = await router.handleCallback(
      studentBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(s08Resp);

    const s08Text = s08Resp.sendMessage?.text ?? '';
    expect(s08Text).toContain('Студент');
    expect(hasButton(s08Resp, 'Назад к списку')).toBe(true);

    // ── 7: «⬅️ Назад к списку» → S07
    const backBtn = findButton(s08Resp, 'Назад к списку');
    const backResp = await router.handleCallback(
      backBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(backResp);
    expect(backResp.sendMessage?.text).toContain('Студенты');
  });

  test('Роль-гейтинг: студент НЕ видит «Инструменты ментора»', async () => {
    const student = (await app.userFacade.getUserByTelegramId(1003))!;
    const menu = (await router.collectMainMenu(student)) as CbMainMenuAction[];
    const hasMentorTools = menu.some((item) =>
      item.text.includes('Инструменты ментора'),
    );
    expect(hasMentorTools).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Сценарий 2: «⚠️ Неактивен» — mark-abandoned (отдельный app)
// ═══════════════════════════════════════════════════════════════════

describe('E2E: «⚠️ Неактивен» из S07', () => {
  let app: TestApp;
  let router: UiApp;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-mark-abandoned');
    const streamController = new StreamController();
    streamController.init(app.apiApp, undefined as never);
    router = new UiApp([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('Ментор → S07 → «⚠️ Неактивен» → confirm → abandoned', async () => {
    // ── S07
    const studentsResp = await router.handleCallback(
      `stream:monitor:students:${SYNTAX_STREAM_ID}`,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(studentsResp);

    const abandonBtn = findButton(studentsResp, '⛔');

    // ── Confirm
    const confirmResp = await router.handleCallback(
      abandonBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(confirmResp);

    expect(confirmResp.sendMessage?.text).toContain('Отметить');
    expect(confirmResp.sendMessage?.text).toContain('неактивного');

    // ── Подтвердить
    const yesBtn = findButton(confirmResp, 'Да');
    const doneResp = await router.handleCallback(
      yesBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(doneResp);

    const allTexts = allText(doneResp);
    expect(allTexts).toContain('неактивный');

    // ── Проверка статуса
    const student = await app.streamModule.execute(
      'get-student-progress',
      { studentId: STUDENT_ACTIVE },
      mentor.uuid,
    );
    expect(student.status).toBe('abandoned');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Сценарий 3: «✅ Завершить» (отдельный app)
// ═══════════════════════════════════════════════════════════════════

describe('E2E: «✅ Завершить» из S07', () => {
  let app: TestApp;
  let router: UiApp;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-complete-student');
    const streamController = new StreamController();
    streamController.init(app.apiApp, undefined as never);
    router = new UiApp([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('Ментор → S07 → «✅ Завершить» → выбор «Прошёл» → confirm → advanced', async () => {
    const studentsResp = await router.handleCallback(
      `stream:monitor:students:${SYNTAX_STREAM_ID}`,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(studentsResp);

    const completeBtn = findButton(studentsResp, '✅');

    // ── Выбор исхода
    const choiceResp = await router.handleCallback(
      completeBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(choiceResp);

    expect(choiceResp.sendMessage?.text).toContain('Выберите исход');
    expect(hasButton(choiceResp, 'Прошёл')).toBe(true);
    expect(hasButton(choiceResp, 'Не прошёл')).toBe(true);

    // ── «Прошёл» → подтверждение
    const advancedBtn = findButton(choiceResp, 'Прошёл');
    const confirmResp = await router.handleCallback(
      advancedBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(confirmResp);

    expect(confirmResp.sendMessage?.text).toContain('Завершить студента');
    expect(confirmResp.sendMessage?.text).toContain('прошёл');

    // ── Подтвердить
    const yesBtn = findButton(confirmResp, 'Завершить');
    const doneResp = await router.handleCallback(
      yesBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(doneResp);

    expect(allText(doneResp)).toContain('завершён');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Сценарий 4: Админ
// ═══════════════════════════════════════════════════════════════════

describe('E2E: Админ видит менторские инструменты', () => {
  let app: TestApp;
  let router: UiApp;
  let admin: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-admin');
    const streamController = new StreamController();
    streamController.init(app.apiApp, undefined as never);
    router = new UiApp([streamController]);
    admin = (await app.userFacade.getUserByTelegramId(1005))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('Админ: главное меню → подменю Мои потоки (пустой список, нет своих потоков)', async () => {
    const menu = (await router.collectMainMenu(admin)) as CbMainMenuAction[];
    const mentorItem = findMenuItem(menu, 'Инструменты ментора');

    const submenuResp = await router.handleCallback(
      mentorItem.action,
      admin,
      NO_SESSION,
    );
    assertBotResponseValid(submenuResp);
    expect(submenuResp.sendMessage?.text).toContain('Инструменты ментора');
    expect(hasButton(submenuResp, 'Мои потоки')).toBe(true);

    // Админ не является ментором потока Syntax → пустой список
    const myStreamsBtn = findButton(submenuResp, 'Мои потоки');
    const streamsResp = await router.handleCallback(
      myStreamsBtn.code,
      admin,
      NO_SESSION,
    );
    assertBotResponseValid(streamsResp);

    expect(streamsResp.sendMessage?.text).toContain('Мои потоки');
    // У админа нет своих потоков (mentorId фильтрация) — точки экранированы для MarkdownV2
    expect(streamsResp.sendMessage?.text).toContain('нет потоков');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Сценарий 5: «🔄 Сменить исход»
// ═══════════════════════════════════════════════════════════════════

describe('E2E: «🔄 Сменить исход»', () => {
  let app: TestApp;
  let router: UiApp;
  let mentor: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-switch-outcome');
    const streamController = new StreamController();
    streamController.init(app.apiApp, undefined as never);
    router = new UiApp([streamController]);
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('Ментор → S07 → «🔄 Сменить исход» → advanced → not_advanced', async () => {
    const studentsResp = await router.handleCallback(
      `stream:monitor:students:${SYNTAX_STREAM_ID}`,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(studentsResp);

    const switchBtn = findButton(studentsResp, '🔄');

    // ── Выбор нового исхода
    const choiceResp = await router.handleCallback(
      switchBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(choiceResp);
    expect(choiceResp.sendMessage?.text).toContain('Выберите исход');

    // ── «Не прошёл» → подтверждение
    const notAdvancedBtn = findButton(choiceResp, 'Не прошёл');
    const confirmResp = await router.handleCallback(
      notAdvancedBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(confirmResp);
    expect(confirmResp.sendMessage?.text).toContain('не прошёл');

    // ── Подтвердить
    const yesBtn = findButton(confirmResp, 'Завершить');
    const doneResp = await router.handleCallback(
      yesBtn.code,
      mentor,
      NO_SESSION,
    );
    assertBotResponseValid(doneResp);

    expect(allText(doneResp)).toContain('завершён');

    // ── Проверка статуса
    const student = await app.streamModule.execute(
      'get-student-progress',
      { studentId: STUDENT_ADVANCED },
      mentor.uuid,
    );
    expect(student.status).toBe('not_advanced');
  });
});
