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
import { assertBotResponseValid, type BotResponse } from '@u7-scl/core/ui';
import type { QuestionnaireState } from '@u7-scl/questionnaire/domain';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import type { SentMessage } from '@u7-scl/test-helpers/test-bot-transport';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import type { WishStatus } from '@u7-scl/wish/domain';
import { QuestionnaireController } from '../../src/controllers/questionnaire/controller';

/**
 * E2E тест wish-флоу (ветка B — анкетная):
 *   apply → проактивная анкета (FillStory) → ответы → ER confirm/abandon → W04/W05
 *
 * Полный контур: CoursesController + QuestionnaireController + общая с apiApp
 * шина событий. Проактивные сообщения FillStory читаются из
 * transport.api.sentMessages (асинхронная доставка — poll с таймаутом),
 * статусы желаний — по фактическому содержимому wishRepo.
 */

// Фикстурный курс с опасным названием и малым пулом анкеты (3 вопроса)
const QUESTIONNAIRE_COURSE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

describe('Wish: анкетная ветка (e2e)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let guest: User;
  let candidate: User;
  let student: User;
  let mentor: User;
  let admin: User;
  let author: User;

  beforeAll(async () => {
    app = await createTestApp('wish-questionnaire-e2e');
    const courseController = new CoursesController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    const questionnaireController = new QuestionnaireController(
      app.questionnaireModule,
    );
    transport = createTestBotTransport(app, [
      appController,
      courseController,
      questionnaireController,
    ]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    candidate = (await app.userFacade.getUserByTelegramId(1002))!;
    student = (await app.userFacade.getUserByTelegramId(1003))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    admin = (await app.userFacade.getUserByTelegramId(1005))!;
    author = (await app.userFacade.getUserByTelegramId(1006))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Хелперы ──

  /**
   * Ожидает, пока probe не вернёт значение. Проактивные сообщения FillStory
   * и ER-реакции доставляются асинхронно (fire-and-forget eventBus) —
   * ждём poll'ом с таймаутом, а не «сном наугад».
   */
  async function waitFor<T>(
    what: string,
    probe: () => T | undefined | Promise<T | undefined>,
    timeoutMs = 3000,
  ): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = await probe();
      if (found !== undefined) return found;
      if (Date.now() > deadline) {
        throw new Error(`Таймаут ожидания: ${what}`);
      }
      await Bun.sleep(25);
    }
  }

  /** Проактивное сообщение пользователю с подстрокой в тексте. */
  function waitForSent(
    tgId: number,
    textContains: string,
  ): Promise<SentMessage> {
    return waitFor(`сообщение «${textContains}» для ${tgId}`, () =>
      transport.api.sentMessages.find(
        (m) => m.telegramId === tgId && m.text.includes(textContains),
      ),
    );
  }

  /** Статус желания пользователя на курс (по репозиторию). */
  async function wishStatuses(
    user: User,
    courseId: string,
  ): Promise<WishStatus[]> {
    return (
      await app.wishRepo.findAllByUserAndTarget(user.uuid, {
        kind: 'course',
        courseId,
      })
    ).map((w) => w.status);
  }

  /** Ожидает появления статуса желания в репозитории (асинхронная ER). */
  function waitForWishStatus(
    user: User,
    courseId: string,
    status: WishStatus,
  ): Promise<WishStatus> {
    return waitFor(`статус желания ${status}`, async () =>
      (await wishStatuses(user, courseId)).includes(status)
        ? status
        : undefined,
    );
  }

  /** Статус standard-анкеты пользователя по курсу (по UC модуля). */
  async function questionnaireStatus(
    user: User,
    courseId: string,
  ): Promise<QuestionnaireState['status'] | undefined> {
    const states = (await app.questionnaireModule.execute(
      'get-questionnaires-by-user',
      { userId: user.uuid },
      user.uuid,
    )) as QuestionnaireState[];
    return states.find(
      (s) => s.kind === 'standard' && s.ownerInfo.courseId === courseId,
    )?.status;
  }

  /** Активный обработчик сессии пользователя. */
  function activeHandler(tgId: number): {
    path: string;
    context?: unknown;
  } | null {
    return transport.sessionMap.get(tgId)?.activeHandler ?? null;
  }

  /**
   * Сбрасывает сессию пользователя — эмуляция перезапуска бота
   * (сессии хранятся в памяти процесса). После сброса повторный apply
   * доходит до UC и возвращает W04 по статусу желания из репозитория.
   */
  function dropSession(tgId: number): void {
    transport.sessionMap.delete(tgId);
  }

  /** apply (кнопка «Хочу пройти курс» в карточке анкетного курса). */
  function applyQuestionnaire(tgId: number): Promise<BotResponse | null> {
    return transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: `course:course-catalog:apply:${QUESTIONNAIRE_COURSE_ID}`,
      }),
    );
  }

  /** Клик по кнопке с точным текстом (код берётся из ответа — сжатие учтено). */
  async function click(
    tgId: number,
    response: BotResponse | null,
    buttonText: string,
  ): Promise<BotResponse | null> {
    const btn = response?.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text === buttonText);
    expect(btn, `Кнопка «${buttonText}» не найдена в ответе`).toBeDefined();
    return transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: btn!.code }),
    );
  }

  /** Оборачивает проактивное сообщение в BotResponse для валидатора. */
  function asBotResponse(msg: SentMessage): BotResponse {
    return {
      sendMessage: {
        text: msg.text,
        keyboard: msg.keyboard,
        parseMode: msg.parseMode,
      },
    };
  }

  // ── B.1: apply → пустой ответ стори + проактивный первый вопрос ──

  test('apply анкетного курса → пустой ответ стори, проактивный «Вопрос 1 из 3», желание pending', async () => {
    // Анкетная ветка: стори ничего не шлёт, анкету рендерит FillStory
    // проактивно через questionnaire:start. Ответ может «подхватить»
    // проактивное сообщение (гонка) — проверяем только валидность.
    const response = await applyQuestionnaire(guest.telegramId);
    assertBotResponseValid(response);

    // Проактивный первый вопрос: текст, прогресс, подсказка /cancel
    const q1 = await waitForSent(guest.telegramId, 'Вопрос 1 из 3');
    assertBotResponseValid(asBotResponse(q1));
    expect(q1.text).toContain('Какой у тебя опыт?');
    expect(q1.text).toContain('/cancel');
    // single-choice: кнопки-варианты «1»…«3»
    expect(q1.keyboard?.rows[0]?.map((b) => b.text)).toEqual(['1', '2', '3']);

    // Сессия: захват ввода fill-сторией с questionnaireId в контексте
    const handler = activeHandler(guest.telegramId);
    expect(handler?.path).toBe('questionnaire/fill');
    expect(
      (handler?.context as { questionnaireId?: string } | undefined)
        ?.questionnaireId,
    ).toBeDefined();

    // Анкетная ветка создаёт желание в pending (по репозиторию)
    expect(
      await waitForWishStatus(guest, QUESTIONNAIRE_COURSE_ID, 'pending'),
    ).toBe('pending');
  });

  // ── B.2: «Вопрос 2 из 3» без подсказки + опасный текст-ответ ──

  test('выбор в вопросе 1 → текстовый «Вопрос 2 из 3» без подсказки; опасный ответ не ломает бота', async () => {
    const first = await applyQuestionnaire(candidate.telegramId);
    assertBotResponseValid(first);
    const q1 = await waitForSent(candidate.telegramId, 'Вопрос 1 из 3');

    // Выбор «1» (Новичок) → текстовый вопрос 2
    const q2 = await click(candidate.telegramId, asBotResponse(q1), '1');
    assertBotResponseValid(q2);
    expect(q2?.sendMessage?.text).toContain('Вопрос 2 из 3');
    expect(q2?.sendMessage?.text).toContain('Опиши свою цель');
    // Подсказка про /cancel — только на первом вопросе
    expect(q2?.sendMessage?.text).not.toContain('/cancel');
    // text-вопрос рендерится без клавиатуры (ввод с клавиатуры)
    expect(q2?.sendMessage?.keyboard).toBeUndefined();

    // Опасный ответ (спецсимволы MarkdownV2) — бот не падает
    const q3 = await transport.handleMessage(
      transport.makeBotContext(candidate.telegramId, {
        text: 'Да. Конечно - (тест) #1! +2=2',
      }),
    );
    assertBotResponseValid(q3);
    expect(q3?.sendMessage?.text).toContain('Вопрос 3 из 3');
    expect(q3?.sendMessage?.text).toContain('Как удобнее учиться');
  });

  // ── B.3: /cancel посреди анкеты → abandoned (ER abandon-wish) ──

  test('/cancel посреди анкеты → подтверждение → анкета и желание abandoned', async () => {
    const first = await applyQuestionnaire(student.telegramId);
    assertBotResponseValid(first);
    await waitForSent(student.telegramId, 'Вопрос 1 из 3');

    // /cancel при активной анкете — экран подтверждения с cancelWarning из пула
    const confirmScreen = await transport.handleCancel(
      transport.makeBotContext(student.telegramId),
    );
    assertBotResponseValid(confirmScreen);
    expect(confirmScreen?.sendMessage?.text).toContain(
      'хотите прервать анкету',
    );
    expect(confirmScreen?.sendMessage?.text).toContain('начать заново');
    // Анкета ещё не брошена
    expect(await questionnaireStatus(student, QUESTIONNAIRE_COURSE_ID)).toBe(
      'in_progress',
    );

    // «✅ Да, прервать» → abandon UC + ER abandon-wish
    const done = await click(
      student.telegramId,
      confirmScreen,
      '✅ Да, прервать',
    );
    assertBotResponseValid(done);
    expect(done?.sendMessage?.text).toContain('Анкета прервана');
    expect(done?.releaseInput).toBe(true);
    expect(activeHandler(student.telegramId)).toBeNull();

    // ER: желание pending → abandoned (по репозиторию)
    expect(
      await waitForWishStatus(student, QUESTIONNAIRE_COURSE_ID, 'abandoned'),
    ).toBe('abandoned');
    expect(await questionnaireStatus(student, QUESTIONNAIRE_COURSE_ID)).toBe(
      'abandoned',
    );
  });

  // ── B.4: apply при незавершённой анкете → W04 pending → resume ──

  test('повторный apply при незавершённой анкете → W04 pending → «Продолжить анкету» → тот же вопрос', async () => {
    const first = await applyQuestionnaire(mentor.telegramId);
    assertBotResponseValid(first);
    await waitForSent(mentor.telegramId, 'Вопрос 1 из 3');

    // Сессия потеряна (рестарт бота) — повторный apply доходит до UC:
    // активное желание pending → конфликт → W04 «начал заполнять анкету»
    dropSession(mentor.telegramId);
    const w04 = await applyQuestionnaire(mentor.telegramId);
    assertBotResponseValid(w04);
    expect(w04?.sendMessage?.text).toContain('начал заполнять анкету');
    expect(w04?.sendMessage?.text).not.toContain('⚠️');

    // «▶️ Продолжить анкету» → resume → текущий (первый) вопрос
    const resume = await click(mentor.telegramId, w04, '▶️ Продолжить анкету');
    assertBotResponseValid(resume);
    expect(resume?.sendMessage?.text).toContain('Вопрос 1 из 3');
    expect(resume?.sendMessage?.text).toContain('Какой у тебя опыт?');
    // Сессия восстановлена: захват ввода fill-сторией
    const handler = activeHandler(mentor.telegramId);
    expect(handler?.path).toBe('questionnaire/fill');
    expect(
      (handler?.context as { questionnaireId?: string } | undefined)
        ?.questionnaireId,
    ).toBeDefined();
  });

  // ── B.7: resume без активной анкеты → контролируемый ответ ──

  test('resume без активной анкеты → «не найдена» без ⚠️', async () => {
    // У автора нет анкет по этому курсу
    const resp = await transport.handleCallback(
      transport.makeBotContext(author.telegramId, {
        callbackData: `questionnaire:fill:resume:${QUESTIONNAIRE_COURSE_ID}`,
      }),
    );
    assertBotResponseValid(resp);
    expect(resp?.sendMessage?.text).toContain(
      'Анкета не найдена или уже завершена',
    );
    expect(resp?.sendMessage?.text).not.toContain('⚠️');
  });

  // ── B.5: полное прохождение → completed, желание confirmed (ER) ──

  test('полное прохождение: 3 вопроса → completed-экран, желание confirmed', async () => {
    // Вход в анкету: apply → W04 pending → resume (сессия потеряна после apply)
    const first = await applyQuestionnaire(admin.telegramId);
    assertBotResponseValid(first);
    await waitForSent(admin.telegramId, 'Вопрос 1 из 3');
    dropSession(admin.telegramId);
    const w04 = await applyQuestionnaire(admin.telegramId);
    const resume = await click(admin.telegramId, w04, '▶️ Продолжить анкету');
    expect(resume?.sendMessage?.text).toContain('Вопрос 1 из 3');

    // В1 (single choice): «Средний» → В2
    const q2 = await click(admin.telegramId, resume, '2');
    expect(q2?.sendMessage?.text).toContain('Вопрос 2 из 3');

    // В2 (text): свободный ответ → В3
    const q3 = await transport.handleMessage(
      transport.makeBotContext(admin.telegramId, {
        text: 'Хочу стать разработчиком',
      }),
    );
    expect(q3?.sendMessage?.text).toContain('Вопрос 3 из 3');

    // В3 (multiple): отметить оба варианта
    const sel1 = await click(admin.telegramId, q3, '1');
    expect(sel1?.sendMessage?.text).toContain('\\[x\\]');
    const sel2 = await click(admin.telegramId, sel1, '2');
    expect(sel2?.sendMessage?.text).toContain('\\[x\\]');
    expect(
      sel2?.sendMessage?.keyboard?.rows.flat().some((b) => b.text === '1'),
    ).toBe(true);

    // «Далее -->» → completed: completionText из пула
    const done = await click(admin.telegramId, sel2, 'Далее -->');
    assertBotResponseValid(done);
    expect(done?.sendMessage?.text).toContain('Желание пройти курс закреплено');
    expect(done?.releaseInput).toBe(true);

    // ER confirm-wish: желание pending → confirmed (по репозиторию)
    expect(
      await waitForWishStatus(admin, QUESTIONNAIRE_COURSE_ID, 'confirmed'),
    ).toBe('confirmed');
    expect(await questionnaireStatus(admin, QUESTIONNAIRE_COURSE_ID)).toBe(
      'completed',
    );
  });

  // ── B.6: apply при confirmed → W04 → отмена → cancelled ──

  test('apply при confirmed → «обучаешься»; отмена желания → cancelled', async () => {
    // Прогоняем анкету до конца (confirmed); после последнего ответа
    // ввод освобождён, но сессию сбрасываем — как после рестарта бота
    const first = await applyQuestionnaire(author.telegramId);
    assertBotResponseValid(first);
    await waitForSent(author.telegramId, 'Вопрос 1 из 3');
    dropSession(author.telegramId);
    const w04a = await applyQuestionnaire(author.telegramId);
    const resume = await click(author.telegramId, w04a, '▶️ Продолжить анкету');
    const q2 = await click(author.telegramId, resume, '2');
    const q3 = await transport.handleMessage(
      transport.makeBotContext(author.telegramId, { text: 'Цель' }),
    );
    const sel1 = await click(author.telegramId, q3, '1');
    const sel2 = await click(author.telegramId, sel1, '2');
    const done = await click(author.telegramId, sel2, 'Далее -->');
    expect(done?.releaseInput).toBe(true);
    expect(
      await waitForWishStatus(author, QUESTIONNAIRE_COURSE_ID, 'confirmed'),
    ).toBe('confirmed');

    // apply при confirmed → W04 «обучаешься» с кнопкой отмены
    const w04 = await applyQuestionnaire(author.telegramId);
    assertBotResponseValid(w04);
    expect(w04?.sendMessage?.text).toContain('обучаешься');
    expect(w04?.sendMessage?.text).not.toContain('⚠️');

    // Отмена из confirmed: подтверждение → W05 «отменено»
    const confirmScreen = await click(
      author.telegramId,
      w04,
      '🗑️ Отменить желание',
    );
    expect(confirmScreen?.sendMessage?.text).toContain(
      'Отменить желание пройти курс?',
    );
    const w05 = await click(author.telegramId, confirmScreen, '✅ Да');
    assertBotResponseValid(w05);
    expect(w05?.sendMessage?.text).toContain('отменено');

    expect(
      await waitForWishStatus(author, QUESTIONNAIRE_COURSE_ID, 'cancelled'),
    ).toBe('cancelled');
    expect(await wishStatuses(author, QUESTIONNAIRE_COURSE_ID)).not.toContain(
      'confirmed',
    );
  });
});
