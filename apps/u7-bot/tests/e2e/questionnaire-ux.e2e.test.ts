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
import { assertBotResponseValid, type BotResponse } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import type { SentMessage } from '@u7-scl/test-helpers/test-bot-transport';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { QuestionnaireController } from '../../src/controllers/questionnaire/controller';

/**
 * E2E: UX анкет (spec FR-1/FR-2) и takeover-перехват ввода (spec FR-5).
 *
 * Уровень Telegram: проверяются РЕАЛЬНЫЕ вызовы sendMessage/editMessageText —
 * маркеры вопросов, удаление клавиатур, предупреждающая строка takeover.
 * Пул анкетного курса (3 вопроса): Q1 radio → Q2 text → Q3 multiple.
 */

const QUESTIONNAIRE_COURSE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

describe('Questionnaire UX (e2e)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  // Отдельный пользователь на тест: apply выдаёт одну активную анкету на курс.
  // fillGuest — для takeover-теста: GUEST (видит «Записаться» в карточке потока).
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

  function click(
    tgId: number,
    msg:
      | {
          keyboard?: { rows: { text: string; code: string }[][] };
          sendMessage?: {
            keyboard?: { rows: { text: string; code: string }[][] };
          };
        }
      | undefined,
    buttonText: string,
  ): Promise<BotResponse | null> {
    const kb = msg?.keyboard ?? msg?.sendMessage?.keyboard;
    const btn = kb?.rows.flat().find((b) => b.text === buttonText);
    expect(btn, `Кнопка «${buttonText}» не найдена`).toBeDefined();
    return transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: btn!.code }),
    );
  }

  function applyQuestionnaire(tgId: number): Promise<BotResponse | null> {
    return transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: `course:course-catalog:apply:${QUESTIONNAIRE_COURSE_ID}`,
      }),
    );
  }

  function activeHandler(tgId: number): string | null {
    return transport.sessionMap.get(tgId)?.activeHandler?.path ?? null;
  }

  /**
   * Вход в анкету: apply → проактивный Q1.
   * Возвращает сообщение Q1 (radio, кнопки 1/2/3).
   */
  async function startQuestionnaire(tgId: number): Promise<SentMessage> {
    await applyQuestionnaire(tgId);
    const q1 = await waitForSent(tgId, 'Вопрос 1 из 3');
    expect(q1.keyboard?.rows[0]?.map((b) => b.text)).toEqual(['1', '2', '3']);
    return q1;
  }

  // ── FR-1: radio — маркер (x), клавиатура удалена, история сохраняется ──

  test('radio: выбор → editMessage с маркером (x) и БЕЗ клавиатуры → новый вопрос новым сообщением', async () => {
    const q1 = await startQuestionnaire(guest.telegramId);
    expect(q1.messageId).toBeDefined();

    // Выбор «2» → Q2 (text) новым сообщением
    await click(guest.telegramId, q1, '2');
    const q2 = await waitForSent(guest.telegramId, 'Вопрос 2 из 3');
    assertBotResponseValid({
      sendMessage: {
        text: q2.text,
        keyboard: q2.keyboard,
        parseMode: q2.parseMode,
      },
    });

    // История: Q1 отредактирован, а не заменён — тот же messageId.
    // ВАЖНО: берём ПОСЛЕДНИЙ edit — раньше мог пройти штатное снятие
    // клавиатуры пустым ответом apply (гонка с проактивной отправкой).
    const edits = transport.api.editedMessages.filter(
      (e) => e.telegramId === guest.telegramId && e.messageId === q1.messageId,
    );
    expect(edits.length).toBeGreaterThanOrEqual(1);
    const q1Edit = edits[edits.length - 1]!;
    expect(q1Edit.text).toContain('Какой у тебя опыт?');
    // Маркер radio: (x) у выбранного, ( ) у остальных
    expect(q1Edit.text).toContain('\\(x\\)');
    expect(q1Edit.text).toContain('\\( \\)');
    // Клавиатура удалена
    expect(q1Edit.keyboard).toBeUndefined();
  });

  // ── FR-2: multiple — тогглы на месте, «Далее» по выбору ──

  test('multiple: тоггл редактирует на месте (клавиатура жива), «Далее» появляется/исчезает', async () => {
    // Дойти до Q3 (multiple)
    const q1 = await startQuestionnaire(candidate.telegramId);
    await click(candidate.telegramId, q1, '2');
    await transport.handleMessage(
      transport.makeBotContext(candidate.telegramId, { text: 'Цель' }),
    );
    const q3 = await waitForSent(candidate.telegramId, 'Вопрос 3 из 3');
    // FR-2: «Далее» НЕ рендерится, пока не выбран ни один вариант
    expect(q3.keyboard?.rows.flat().map((b) => b.text)).toEqual(['1', '2']);
    expect(q3.messageId).toBeDefined();

    // Тоггл «1» → editMessage того же сообщения (messageId совпадает)
    await click(candidate.telegramId, q3, '1');
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
    await click(candidate.telegramId, q3, '1');
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

  test('«Далее» → editMessage Q3 с финальными маркерами без клавиатуры + completed новым сообщением', async () => {
    const q1 = await startQuestionnaire(student.telegramId);
    await click(student.telegramId, q1, '2');
    await transport.handleMessage(
      transport.makeBotContext(student.telegramId, { text: 'Цель' }),
    );
    const q3 = await waitForSent(student.telegramId, 'Вопрос 3 из 3');
    await click(student.telegramId, q3, '1');

    // «Далее» появляется в отредактированной клавиатуре после выбора
    const toggled = await waitFor('edit тоггла с «Далее»', () =>
      transport.api.editedMessages.find(
        (e) =>
          e.telegramId === student.telegramId &&
          e.messageId === q3.messageId &&
          e.keyboard?.rows.flat().some((b) => b.text === 'Далее -->'),
      ),
    );
    const done = await click(student.telegramId, toggled, 'Далее -->');
    assertBotResponseValid(done);
    expect(done?.releaseInput).toBe(true);

    // Финальные маркеры в Q3, клавиатура удалена
    const finalEdit = await waitFor('финальный edit Q3', () =>
      transport.api.editedMessages.find(
        (e) =>
          e.telegramId === student.telegramId &&
          e.messageId === q3.messageId &&
          e.keyboard === undefined,
      ),
    );
    expect(finalEdit.text).toContain('\\[x\\]');

    // completed — новым сообщением
    const doneMsg = await waitForSent(
      student.telegramId,
      'Желание пройти курс закреплено',
    );
    expect(doneMsg.keyboard?.rows.flat().map((b) => b.text)).toEqual([
      '↩️ Главное меню',
    ]);
  });

  // ── FR-5: takeover — перехват ввода при чужом активном действии ──

  /**
   * Запускает «чужой» флоу с активным вводом (ввод кодового слова потока)
   * — честная замена «активного урока»: activeHandler другого контроллера.
   */
  async function startForeignFlow(tgId: number): Promise<void> {
    const ENROLL_KEY_STREAM = 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4';
    const view = await transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: `stream:view-stream:view:${ENROLL_KEY_STREAM}`,
      }),
    );
    const enrollBtn = view?.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Записаться'));
    expect(enrollBtn).toBeDefined();
    const prompt = await transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: enrollBtn!.code }),
    );
    expect(prompt?.captureInput).toBeDefined();
    expect(activeHandler(tgId)).toBe('stream/view-stream/enroll-key');
  }

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

  test('takeover: чужой активный флоу → приглашение со строкой-предупреждением → «Продолжить анкету» перехватывает ввод', async () => {
    // 1. Анкета начата (in_progress)
    await startQuestionnaire(fillGuest.telegramId);

    // 2. Сессия потеряна (рестарт бота): анкета остаётся in_progress,
    //    пользователь начинает чужой флоу (ввод кодового слова потока)
    transport.sessionMap.delete(fillGuest.telegramId);
    await startForeignFlow(fillGuest.telegramId);

    // 3. Проактивное приглашение продолжить — со строкой-предупреждением
    publishContinueInvite(fillGuest.telegramId);
    const invite = await waitForSent(
      fillGuest.telegramId,
      'Вы начали заполнять анкету — продолжим?',
    );
    expect(invite.text).toContain(
      '⚠️ Нажатие на кнопку приведёт к окончанию вашего текущего действия\\.',
    );

    // 4. Клик по takeover-кнопке — НЕ блокируется, захват перезаписан
    const resumeBtn = invite.keyboard?.rows
      .flat()
      .find((b) => b.text === '▶️ Продолжить анкету');
    expect(resumeBtn).toBeDefined();
    const resume = await transport.handleCallback(
      transport.makeBotContext(fillGuest.telegramId, {
        callbackData: resumeBtn!.code,
      }),
    );
    assertBotResponseValid(resume);
    expect(resume?.sendMessage?.text).toContain('Вопрос 1 из 3');
    expect(activeHandler(fillGuest.telegramId)).toBe('questionnaire/fill');

    // 5. Анкета заполняется дальше: radio-ответ работает (вопрос → история)
    await click(fillGuest.telegramId, resume, '2');
    await waitForSent(fillGuest.telegramId, 'Вопрос 2 из 3');
    const edit = transport.api.editedMessages.find(
      (e) =>
        e.telegramId === fillGuest.telegramId &&
        e.text.includes('Какой у тебя опыт?') &&
        e.text.includes('\\(x\\)'),
    );
    expect(edit).toBeDefined();
  });

  test('takeover: без активного действия — приглашение БЕЗ строки-предупреждения', async () => {
    // Юзер с активной анкетой, но без сессии (закрыл/перезапустил бот)
    await startQuestionnaire(admin.telegramId);
    transport.sessionMap.delete(admin.telegramId);

    publishContinueInvite(admin.telegramId);
    const invite = await waitForSent(
      admin.telegramId,
      'Вы начали заполнять анкету — продолжим?',
    );
    expect(invite.text).not.toContain('окончанию вашего текущего действия');
    // Takeover-кнопка на месте (RecordingBotApi не хранит флаг — проверяем текст)
    expect(
      invite.keyboard?.rows
        .flat()
        .some((b) => b.text === '▶️ Продолжить анкету'),
    ).toBe(true);
  });
});
