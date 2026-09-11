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
import type { QuestionnaireState } from '@u7-scl/questionnaire/domain';
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
  stampedCode,
} from '@u7-scl/test-helpers/test-bot-transport';
import type { WishStatus } from '@u7-scl/wish/domain';
import { QuestionnaireController } from '../../src/controllers/questionnaire/controller';

/**
 * E2E тест wish-флоу (ветка B — анкетная):
 *   apply → приглашение «заполнить анкету» (вариант A) → анкета (FillStory)
 *   → ответы → ER confirm/abandon → W04/W05
 *
 * Полный контур: CoursesController + QuestionnaireController + общая с apiApp
 * шина событий. Экраны ассертятся по DialogResponse (захват на границе uiApp)
 * и Api-записям; статусы желаний — по фактическому содержимому wishRepo.
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
    const questionnaireController = new QuestionnaireController();
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
   * Ожидает, пока probe не вернёт значение. Приглашения FillStory
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

  /** Сообщение пользователю с подстрокой в тексте (канал приглашений). */
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
    const states = await app.apiApp.execute(
      'get-questionnaires-by-user',
      { userId: user.uuid },
      user.uuid,
    );
    return states.find(
      (s) => s.kind === 'standard' && s.ownerInfo.courseId === courseId,
    )?.status;
  }

  /**
   * Сбрасывает сессию пользователя — эмуляция перезапуска бота
   * (сессии хранятся в памяти процесса).
   */
  function dropSession(tgId: number): void {
    transport.dropSession(tgId);
  }

  /** Клик по кнопке с текстом (код — отштампованный, из Api-записи). */
  function click(tgId: number, buttonText: string) {
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

  /** apply (кнопка «Хочу пройти курс» в каталоге). */
  function applyQuestionnaire(tgId: number) {
    return transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: applyCode(tgId) }),
    );
  }

  /** Контекст анкеты активного ввода (questionnaireId). */
  function fillContext(tgId: number): { questionnaireId?: string } | undefined {
    return transport.dialogOf(tgId)?.input?.context as
      | { questionnaireId?: string }
      | undefined;
  }

  /**
   * Вход в анкету: каталог → apply → приглашение «заполнить анкету»
   * (вариант A) → кнопка-мост → Q1. Возвращает сообщение Q1.
   */
  async function startQuestionnaire(tgId: number): Promise<SentMessage> {
    await openCatalog(tgId);
    await applyQuestionnaire(tgId);
    const invite = await waitForSent(tgId, 'Для вас подготовлена анкета');
    const fillBtn = invite.keyboard?.rows
      .flat()
      .find((b) => b.text === '▶️ Заполнить анкету');
    expect(fillBtn, 'Кнопка «▶️ Заполнить анкету» не найдена').toBeDefined();
    await transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: fillBtn!.code }),
    );
    return waitForSent(tgId, 'Вопрос 1 из 3');
  }

  // ── B.1: apply → приглашение (вариант A) → вход кнопкой-мостом ──

  test('apply анкетного курса → приглашение «заполнить анкету» → кнопка-мост → Q1, желание pending', async () => {
    const response = await (async () => {
      await openCatalog(guest.telegramId);
      return applyQuestionnaire(guest.telegramId);
    })();
    // Анкетная ветка: стори ничего не шлёт — только событие start
    expect(response.screen).toBeUndefined();

    // Приглашение (вариант A): сервер только зовёт, диалог открывает
    // пользователь; подсказка /start на случай устаревшего экрана
    const invite = await waitForSent(
      guest.telegramId,
      'Для вас подготовлена анкета',
    );
    expect(invite.text).toContain('заполните, пожалуйста');
    expect(invite.text).toContain('/start');
    expect(invite.keyboard?.rows.flat().map((b) => b.text)).toEqual([
      '▶️ Заполнить анкету',
    ]);

    // Кнопка-мост открывает анкету: Q1 с подсказкой /cancel
    const q1 = await startQuestionnaireContinue(guest.telegramId, invite);
    expect(q1.text).toContain('Какой у тебя опыт?');
    expect(q1.text).toContain('/cancel');
    // single-choice: кнопки-варианты «1»…«3»
    expect(q1.keyboard?.rows[0]?.map((b) => b.text)).toEqual(['1', '2', '3']);

    // Сессия: захват ввода fill-диалогом с questionnaireId в контексте
    expect(transport.dialogOf(guest.telegramId)?.path).toBe(
      'questionnaire/fill',
    );
    expect(fillContext(guest.telegramId)?.questionnaireId).toBeDefined();

    // Анкетная ветка создаёт желание в pending (по репозиторию)
    expect(
      await waitForWishStatus(guest, QUESTIONNAIRE_COURSE_ID, 'pending'),
    ).toBe('pending');
  });

  /** Продолжение входа: клик по кнопке приглашения из B.1. */
  async function startQuestionnaireContinue(
    tgId: number,
    invite: SentMessage,
  ): Promise<SentMessage> {
    const fillBtn = invite.keyboard?.rows
      .flat()
      .find((b) => b.text === '▶️ Заполнить анкету')!;
    await transport.handleCallback(
      transport.makeBotContext(tgId, { callbackData: fillBtn.code }),
    );
    return waitForSent(tgId, 'Вопрос 1 из 3');
  }

  // ── B.2: «Вопрос 2 из 3» без подсказки + опасный текст-ответ ──

  test('выбор в вопросе 1 → текстовый «Вопрос 2 из 3» без подсказки; опасный ответ не ломает бота', async () => {
    await startQuestionnaire(candidate.telegramId);
    const q1 = await waitForSent(candidate.telegramId, 'Вопрос 1 из 3');

    // Выбор «1» (Новичок) → текстовый вопрос 2
    const q2 = await click(candidate.telegramId, '2');
    expect(q2.screen?.text).toContain('Вопрос 2 из 3');
    expect(q2.screen?.text).toContain('Опиши свою цель');
    // Подсказка про /cancel — только на первом вопросе
    expect(q2.screen?.text).not.toContain('/cancel');
    // text-вопрос рендерится без клавиатуры (ввод с клавиатуры)
    expect(q2.screen?.keyboard).toBeUndefined();

    // Опасный ответ (спецсимволы MarkdownV2) — бот не падает:
    // битый md не ушёл бы в Telegram (fail-fast транспорта), Q3 не пришёл бы
    const q3 = await transport.handleMessage(
      transport.makeBotContext(candidate.telegramId, {
        text: 'Да. Конечно - (тест) #1! +2=2',
      }),
    );
    expect(q3.screen?.text).toContain('Вопрос 3 из 3');
    expect(q3.screen?.text).toContain('Как удобнее учиться');
    await waitForSent(candidate.telegramId, 'Вопрос 3 из 3');
  });

  // ── B.3: /cancel посреди анкеты → abandoned (ER abandon-wish) ──

  test('/cancel посреди анкеты → подтверждение → анкета и желание abandoned', async () => {
    await startQuestionnaire(student.telegramId);
    await waitForSent(student.telegramId, 'Вопрос 1 из 3');

    // /cancel при активной анкете — экран подтверждения с cancelWarning из пула
    const confirmScreen = await transport.handleCancel(
      transport.makeBotContext(student.telegramId),
    );
    expect(confirmScreen.screen?.text).toContain('хотите прервать анкету');
    expect(confirmScreen.screen?.text).toContain('начать заново');
    // Анкета ещё не брошена
    expect(await questionnaireStatus(student, QUESTIONNAIRE_COURSE_ID)).toBe(
      'in_progress',
    );

    // «✅ Да, прервать» → abandon UC + ER abandon-wish
    const done = await click(student.telegramId, '✅ Да, прервать');
    expect(done.screen?.text).toContain('Анкета прервана');
    expect(done.release).toBe(true);
    expect(transport.dialogOf(student.telegramId)?.input).toBeUndefined();

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
    await startQuestionnaire(mentor.telegramId);
    await waitForSent(mentor.telegramId, 'Вопрос 1 из 3');

    // Сессия потеряна (рестарт бота) — повторный apply доходит до UC:
    // активное желание pending → конфликт → W04 «начал заполнять анкету»
    dropSession(mentor.telegramId);
    await openCatalog(mentor.telegramId);
    const w04 = await applyQuestionnaire(mentor.telegramId);
    expect(w04.screen?.text).toContain('начал заполнять анкету');
    expect(w04.screen?.text).not.toContain('⚠️');

    // «▶️ Продолжить анкету» → resume → текущий (первый) вопрос
    const resume = await click(mentor.telegramId, '▶️ Продолжить анкету');
    expect(resume.screen?.text).toContain('Вопрос 1 из 3');
    expect(resume.screen?.text).toContain('Какой у тебя опыт?');
    // Сессия восстановлена: захват ввода fill-диалогом
    expect(transport.dialogOf(mentor.telegramId)?.path).toBe(
      'questionnaire/fill',
    );
    expect(fillContext(mentor.telegramId)?.questionnaireId).toBeDefined();
  });

  // ── B.7: resume без активной анкеты → контролируемый ответ ──

  test('resume без активной анкеты → «не найдена» без ⚠️', async () => {
    // У автора нет анкет по этому курсу: /start (штамп экрана) + прямой код
    await transport.handleStart(transport.makeBotContext(author.telegramId));
    const resp = await transport.handleCallback(
      transport.makeBotContext(author.telegramId, {
        callbackData: stampedCode(
          transport,
          author.telegramId,
          `questionnaire:fill:resume:${QUESTIONNAIRE_COURSE_ID}`,
        ),
      }),
    );
    expect(resp.screen?.text).toContain('Анкета не найдена или уже завершена');
    expect(resp.screen?.text).not.toContain('⚠️');
  });

  // ── B.5: полное прохождение → completed, желание confirmed (ER) ──

  test('полное прохождение: 3 вопроса → completed-экран, желание confirmed', async () => {
    // Вход в анкету: apply → приглашение → Q1
    await startQuestionnaire(admin.telegramId);
    const resume = await waitForSent(admin.telegramId, 'Вопрос 1 из 3');

    // В1 (single choice): «Средний» → В2
    const q2 = await click(admin.telegramId, '2');
    expect(q2.screen?.text).toContain('Вопрос 2 из 3');

    // В2 (text): свободный ответ → В3
    const q3 = await transport.handleMessage(
      transport.makeBotContext(admin.telegramId, {
        text: 'Хочу стать разработчиком',
      }),
    );
    expect(q3.screen?.text).toContain('Вопрос 3 из 3');

    // В3 (multiple): отметить оба варианта
    const sel1 = await click(admin.telegramId, '1');
    expect(sel1.screen?.text).toContain('\\[x\\]');
    const sel2 = await click(admin.telegramId, '2');
    expect(sel2.screen?.text).toContain('\\[x\\]');
    expect(sel2.screen?.keyboard?.rows.flat().some((b) => b.text === '1')).toBe(
      true,
    );

    // «Далее -->» → completed: шапка S04 + completionText из пула
    const done = await click(admin.telegramId, 'Далее -->');
    expect(done.screen?.text).toContain('Анкета завершена');
    expect(done.screen?.text).toContain('Желание пройти курс закреплено');
    expect(done.release).toBe(true);

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
    await startQuestionnaire(author.telegramId);
    await click(author.telegramId, '2');
    await transport.handleMessage(
      transport.makeBotContext(author.telegramId, { text: 'Цель' }),
    );
    await click(author.telegramId, '1');
    await click(author.telegramId, '2');
    const done = await click(author.telegramId, 'Далее -->');
    expect(done.release).toBe(true);
    expect(
      await waitForWishStatus(author, QUESTIONNAIRE_COURSE_ID, 'confirmed'),
    ).toBe('confirmed');

    // apply при confirmed → W04 «обучаешься» с кнопкой отмены
    dropSession(author.telegramId);
    await openCatalog(author.telegramId);
    const w04 = await applyQuestionnaire(author.telegramId);
    expect(w04.screen?.text).toContain('обучаешься');
    expect(w04.screen?.text).not.toContain('⚠️');

    // Отмена из confirmed: подтверждение → W05 «отменено»
    const confirmScreen = await click(author.telegramId, '🗑️ Отменить желание');
    expect(confirmScreen.screen?.text).toContain(
      'Отменить желание пройти курс?',
    );
    const w05 = await click(author.telegramId, '✅ Да');
    expect(w05.screen?.text).toContain('отменено');

    expect(
      await waitForWishStatus(author, QUESTIONNAIRE_COURSE_ID, 'cancelled'),
    ).toBe('cancelled');
    expect(await wishStatuses(author, QUESTIONNAIRE_COURSE_ID)).not.toContain(
      'confirmed',
    );
  });
});
