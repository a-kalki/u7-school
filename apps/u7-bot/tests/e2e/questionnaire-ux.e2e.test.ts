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
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import type {
  SentMessage,
  TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import {
  createTestBotTransport,
  pressedCode,
  screensNewFirst,
} from '@u7-scl/test-helpers/test-bot-transport';
import { QuestionnaireController } from '../../src/controllers/questionnaire/controller';

/**
 * E2E: UX анкет (spec FR-1/FR-2) и приглашения продолжить
 * (spec FR-5, вариант A — кнопка-мост).
 *
 * Уровень Telegram: проверяются РЕАЛЬНЫЕ вызовы sendMessage/editMessageText —
 * финализация вопросов (маркеры, снятие клавиатур), тогглы на месте,
 * приглашения канала invite. Нажатия — отштампованными кодами из Api-записей
 * (как реальный клиент). Пул анкетного курса (3 вопроса):
 * Q1 radio → Q2 text → Q3 multiple.
 */

const QUESTIONNAIRE_COURSE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
// Поток с кодовым словом (enroll-key) — «чужой» флоу в сценарии приглашения
const ENROLL_KEY_STREAM = 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4';

describe('Questionnaire UX (e2e)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  // Отдельный пользователь на тест: apply выдаёт одну активную анкету на курс.
  // fillGuest — для сценария приглашения: GUEST (видит «Записаться» в карточке потока).
  let guest: User;
  let candidate: User;
  let student: User;
  let fillGuest: User;
  let admin: User;

  beforeAll(async () => {
    app = await createTestApp('questionnaire-ux-e2e');
    transport = createTestBotTransport(app, [
      new AppController(SCHOOL_GROUP_URL),
      new CoursesController(),
      new StreamsController(),
      new QuestionnaireController(),
    ]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    candidate = (await app.userFacade.getUserByTelegramId(1002))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    fillGuest = (await app.userFacade.getUserByTelegramId(1007))!;
    admin = (await app.userFacade.getUserByTelegramId(1005))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Хелперы ──

  async function waitFor<T>(
    what: string,
    probe: () => T | undefined,
    timeoutMs = 3000,
  ): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = probe();
      if (found !== undefined) return found;
      if (Date.now() > deadline) {
        throw new Error(`Таймаут ожидания: ${what}`);
      }
      await Bun.sleep(25);
    }
  }

  function waitForSent(
    tgId: number,
    textContains: string,
  ): Promise<SentMessage> {
    return waitFor(`сообщение «${textContains}»`, () =>
      transport.api.sentMessages.find(
        (m) => m.telegramId === tgId && m.text.includes(textContains),
      ),
    );
  }

  /**
   * Ждёт экран с текстом (send или edit): drill-down внутри одной стори
   * рендерится edit'ом на месте (seq не растёт) — сообщения может не быть.
   */
  function waitForScreen(
    tgId: number,
    textContains: string,
  ): Promise<SentMessage | (typeof transport.api.editedMessages)[number]> {
    return waitFor(`экран «${textContains}»`, () => {
      const edited = transport.api.editedMessages.find(
        (e) => e.telegramId === tgId && e.text.includes(textContains),
      );
      if (edited) return edited;
      return transport.api.sentMessages.find(
        (m) => m.telegramId === tgId && m.text.includes(textContains),
      );
    });
  }

  /** Клик по кнопке с текстом (код — отштампованный, из Api-записи). */
  function click(tgId: number, buttonText: string): Promise<unknown> {
    return transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, buttonText),
      }),
    );
  }

  /**
   * apply-кнопка анкетного курса из каталога: ряд
   * [«<эмодзи> Тест. Курс…», «🎓 Хочу пройти курс»] — у каждого курса свой
   * apply, ищем ряд по названию курса.
   */
  function applyCode(tgId: number): string {
    for (const screen of screensNewFirst(transport, tgId)) {
      const row = screen.keyboard?.rows.find(
        (r) =>
          r[0]?.text.includes('Тест. Курс') &&
          r[1]?.text.includes('Хочу пройти курс'),
      );
      if (row) return row[1]!.code;
    }
    throw new Error('apply-кнопка анкетного курса не найдена — открой каталог');
  }

  /** /start → «Программы курсов» (уровень 0 с apply-кнопками). */
  async function openCatalog(tgId: number): Promise<void> {
    await transport.handleStart(transport.makeBotContext(tgId));
    await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: pressedCode(transport, tgId, 'Программы курсов'),
      }),
    );
  }

  /**
   * Вход в анкету: каталог → apply → приглашение «заполнить анкету»
   * (вариант A: сервер только зовёт) → кнопка-мост → Q1.
   * Возвращает сообщение Q1 (radio, кнопки 1/2/3).
   */
  async function startQuestionnaire(tgId: number): Promise<SentMessage> {
    await openCatalog(tgId);
    await transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: applyCode(tgId) }),
    );

    const invite = await waitForSent(tgId, 'Для вас подготовлена анкета');
    const fillBtn = invite.keyboard?.rows
      .flat()
      .find((b) => b.text === '▶️ Заполнить анкету');
    expect(fillBtn, 'Кнопка «▶️ Заполнить анкету» не найдена').toBeDefined();
    await transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: fillBtn!.code }),
    );

    const q1 = await waitForSent(tgId, 'Вопрос 1 из 3');
    expect(q1.keyboard?.rows[0]?.map((b) => b.text)).toEqual(['1', '2', '3']);
    return q1;
  }

  // ── FR-1: radio — финализация (маркер, клавиатура снята), история живёт ──

  test('radio: выбор → финализация Q1 с маркером (x) и БЕЗ клавиатуры → новый вопрос новым сообщением', async () => {
    const q1 = await startQuestionnaire(guest.telegramId);
    expect(q1.messageId).toBeDefined();

    // Выбор «2» → Q2 (text) новым сообщением
    await click(guest.telegramId, '2');
    const q2 = await waitForSent(guest.telegramId, 'Вопрос 2 из 3');
    expect(q2.text).toContain('Опиши свою цель');
    expect(q2.keyboard).toBeUndefined();

    // История: Q1 отредактирован, а не заменён — тот же messageId.
    // Берём ПОСЛЕДНИЙ edit — раньше могло пройти снятие клавиатуры экрана
    // каталога (retire при смене диалога).
    const edits = transport.api.editedMessages.filter(
      (e) => e.telegramId === guest.telegramId && e.messageId === q1.messageId,
    );
    expect(edits.length).toBeGreaterThanOrEqual(1);
    const q1Edit = edits[edits.length - 1]!;
    expect(q1Edit.text).toContain('Какой у тебя опыт?');
    // Маркер radio: (x) у выбранного, ( ) у остальных
    expect(q1Edit.text).toContain('\\(x\\)');
    expect(q1Edit.text).toContain('\\( \\)');
    // Клавиатура снята (finalize гасит экран вопроса)
    expect(q1Edit.keyboard).toBeUndefined();
  });

  // ── FR-2: multiple — тогглы на месте, «Далее» по выбору ──

  test('multiple: тоггл редактирует на месте (клавиатура жива), «Далее» появляется/исчезает', async () => {
    // Дойти до Q3 (multiple)
    const q1 = await startQuestionnaire(candidate.telegramId);
    await click(candidate.telegramId, '2');
    await transport.handleMessage(
      transport.makeBotContext(candidate.telegramId, { text: 'Цель' }),
    );
    const q3 = await waitForSent(candidate.telegramId, 'Вопрос 3 из 3');
    // FR-2: «Далее» НЕ рендерится, пока не выбран ни один вариант
    expect(q3.keyboard?.rows.flat().map((b) => b.text)).toEqual(['1', '2']);
    expect(q3.messageId).toBeDefined();

    // Тоггл «1» → editMessage того же сообщения (messageId совпадает)
    await click(candidate.telegramId, '1');
    const toggleEdit = await waitFor('edit тоггла', () =>
      transport.api.editedMessages.find(
        (e) =>
          e.telegramId === candidate.telegramId &&
          e.messageId === q3.messageId &&
          e.text.includes('\\[x\\]'),
      ),
    );
    expect(toggleEdit.messageId).toBe(q3.messageId);
    expect(toggleEdit.text).toContain('Как удобнее учиться');
    // Клавиатура жива: варианты + «Далее»
    expect(toggleEdit.keyboard?.rows.flat().map((b) => b.text)).toEqual([
      '1',
      '2',
      'Далее -->',
    ]);

    // Снятие выбора → «Далее» исчезает из отредактированного сообщения
    await click(candidate.telegramId, '1');
    const untoggleEdit = await waitFor('edit снятия выбора', () =>
      transport.api.editedMessages.find(
        (e) =>
          e.telegramId === candidate.telegramId &&
          e.messageId === q3.messageId &&
          !e.text.includes('\\[x\\]') &&
          e.keyboard !== undefined,
      ),
    );
    expect(untoggleEdit.keyboard?.rows.flat().map((b) => b.text)).toEqual([
      '1',
      '2',
    ]);
  });

  test('«Далее» → финализация Q3 с финальными маркерами без клавиатуры + completed новым сообщением', async () => {
    const q1 = await startQuestionnaire(student.telegramId);
    await click(student.telegramId, '2');
    await transport.handleMessage(
      transport.makeBotContext(student.telegramId, { text: 'Цель' }),
    );
    const q3 = await waitForSent(student.telegramId, 'Вопрос 3 из 3');
    await click(student.telegramId, '1');

    // «Далее» появляется в отредактированной клавиатуре после выбора
    await waitFor('edit тоггла с «Далее»', () =>
      transport.api.editedMessages.find(
        (e) =>
          e.telegramId === student.telegramId &&
          e.messageId === q3.messageId &&
          e.keyboard?.rows.flat().some((b) => b.text === 'Далее -->'),
      ),
    );
    await click(student.telegramId, 'Далее -->');

    // Финальные маркеры в Q3, клавиатура снята
    const finalEdit = await waitFor('финальный edit Q3', () =>
      transport.api.editedMessages.find(
        (e) =>
          e.telegramId === student.telegramId &&
          e.messageId === q3.messageId &&
          e.keyboard === undefined,
      ),
    );
    expect(finalEdit.text).toContain('\\[x\\]');

    // completed — новым сообщением, шапка S04 + кнопка главного меню
    const doneMsg = await waitForSent(
      student.telegramId,
      'Желание пройти курс закреплено',
    );
    expect(doneMsg.text).toContain('Анкета завершена');
    expect(doneMsg.keyboard?.rows.flat().map((b) => b.text)).toEqual([
      '↩️ Главное меню',
    ]);
    // Ввод отпущен: текст после completed не адресуется анкете
    expect(transport.dialogOf(student.telegramId)?.input).toBeUndefined();
  });

  // ── FR-5 (вариант A): приглашение продолжить — кнопка-мост ──

  /** Публикует событие приглашения продолжить (как SweepAbandonedJob на 3ч). */
  function publishContinueInvite(telegramId: number): void {
    app.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire:continue-invite',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Questionnaire',
      aggregateId: QUESTIONNAIRE_COURSE_ID,
      ownerInfo: { courseId: QUESTIONNAIRE_COURSE_ID },
      payload: {
        questionnaireId: QUESTIONNAIRE_COURSE_ID,
        respondentId: fillGuest.uuid,
        telegramId,
      },
    } as never);
  }

  test('при чужом активном флоу: приглашение без предупреждения → «Продолжить анкету» переключает диалог', async () => {
    // 1. Анкета начата (in_progress)
    await startQuestionnaire(fillGuest.telegramId);

    // 2. Сессия потеряна (рестарт бота): анкета остаётся in_progress,
    //    пользователь начинает чужой флоу (ввод кодового слова потока)
    transport.dropSession(fillGuest.telegramId);
    await transport.handleStart(transport.makeBotContext(fillGuest.telegramId));
    await transport.handleCallback(
      transport.makeBotContext(fillGuest.telegramId, {
        callbackData: pressedCode(
          transport,
          fillGuest.telegramId,
          'Потоки курсов',
        ),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(fillGuest.telegramId, {
        callbackData: pressedCode(transport, fillGuest.telegramId, 'Поток 5'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(fillGuest.telegramId, {
        callbackData: pressedCode(
          transport,
          fillGuest.telegramId,
          'Записаться',
        ),
      }),
    );
    await waitForScreen(fillGuest.telegramId, 'кодовое слово');
    const enrollDialog = transport.dialogOf(fillGuest.telegramId);
    expect(enrollDialog?.input).toBeDefined();
    expect(enrollDialog?.path).not.toBe('questionnaire/fill');

    // 3. Приглашение продолжить: кнопка-мост
    publishContinueInvite(fillGuest.telegramId);
    const invite = await waitForSent(
      fillGuest.telegramId,
      'Вы начали заполнять анкету',
    );
    expect(invite.text).toContain('продолжим?');
    expect(invite.text).not.toContain('окончанию вашего текущего действия');
    expect(invite.text).toContain('/start');
    expect(
      invite.keyboard?.rows
        .flat()
        .some((b) => b.text === '▶️ Продолжить анкету'),
    ).toBe(true);
    expect(
      invite.keyboard?.rows.flat().some((b) => b.text === '⏭️ Прервать'),
    ).toBe(true);

    // 4. Кнопка-мост: диалог switch-ится в fill, прошлый вопрос вернулся
    await transport.handleCallback(
      transport.makeBotContext(fillGuest.telegramId, {
        callbackData: pressedCode(
          transport,
          fillGuest.telegramId,
          'Продолжить анкету',
        ),
      }),
    );
    await waitForSent(fillGuest.telegramId, 'Вопрос 1 из 3');
    expect(transport.dialogOf(fillGuest.telegramId)?.path).toBe(
      'questionnaire/fill',
    );

    // 5. Анкета заполняется дальше: radio-ответ работает (вопрос → история)
    await click(fillGuest.telegramId, '2');
    await waitForSent(fillGuest.telegramId, 'Вопрос 2 из 3');
    const edit = transport.api.editedMessages.find(
      (e) =>
        e.telegramId === fillGuest.telegramId &&
        e.text.includes('Какой у тебя опыт?') &&
        e.text.includes('\\(x\\)'),
    );
    expect(edit).toBeDefined();
  });

  test('без сессии (якорь app/invite): приглашение живо, кнопка открывает анкету', async () => {
    // Юзер с активной анкетой, но без сессии (закрыл/перезапустил бот)
    await startQuestionnaire(admin.telegramId);
    transport.dropSession(admin.telegramId);

    // Приглашение без диалога: транспорт открывает якорь (seq = 1),
    // кнопки заштампованы — приглашение не умирает
    publishContinueInvite(admin.telegramId);
    const invite = await waitForSent(
      admin.telegramId,
      'Вы начали заполнять анкету',
    );
    expect(invite.text).toContain('продолжим?');
    expect(invite.text).toContain('/start');
    const resumeBtn = invite.keyboard?.rows
      .flat()
      .find((b) => b.text === '▶️ Продолжить анкету');
    expect(resumeBtn).toBeDefined();

    // Клик по кнопке-мосту открывает анкету и без /start
    await transport.handleCallback(
      transport.makeBotContext(admin.telegramId, {
        callbackData: resumeBtn!.code,
      }),
    );
    await waitForSent(admin.telegramId, 'Вопрос 1 из 3');
    expect(transport.dialogOf(admin.telegramId)?.path).toBe(
      'questionnaire/fill',
    );
  });
});
