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
import type { Stream } from '@u7-scl/stream/domain';
import { createTestApp, type TestApp } from '@u7-scl/test-helpers/test-app';
import type { SentMessage } from '@u7-scl/test-helpers/test-bot-transport';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { Role } from '@u7-scl/user/domain';
import type { WishTarget } from '@u7-scl/wish/domain';
import { QuestionnaireController } from '../../src/controllers/questionnaire/controller';

/**
 * E2E тест приглашения желающим при открытии набора (S11, трек wish-invite):
 *   apply / «Хочу пройти модуль» → create-stream ментором → проактивное
 *   приглашение с кнопками → «Открыть поток» / «Отменить желание» (W05/W05-M)
 *
 * Полный контур: CoursesController + StreamsController + общая с apiApp шина.
 * Проактивное сообщение WishInviteStory доставляется асинхронно
 * (ProactiveSender) — читается из transport.api.sentMessages poll-ом,
 * статусы желаний — по фактическому содержимому wishRepo.
 */

// Фикстурные идентификаторы:
//   a0a0a0a0 — первый модуль published-курсов (course-ветка приглашения живёт)
//   a1a1a1a1 — второй модуль fafafafa (course-ветка молчит, module-ветка работает)
const FIRST_MODULE_ID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';
const SECOND_MODULE_ID = 'a1a1a1a1-b1b1-4b1b-8b1b-b1b1b1b1b1b1';
// Published instant-курс (без пула анкеты), модуль — a0a0a0a0
const INSTANT_COURSE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
// Published instant-курс «Основы программирования», модули [a0a0a0a0, a1a1a1a1]
const TWO_MODULE_COURSE_ID = 'fafafafa-baba-4aba-8aba-babababababa';

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

describe('Wish: приглашение при открытии набора (e2e)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let guest: User;
  let mentor: User;
  let admin: User;
  let advanced: User;
  let notAdvanced: User;

  beforeAll(async () => {
    app = await createTestApp('wish-invite-e2e');
    const courseController = new CoursesController();
    const streamController = new StreamsController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    const questionnaireController = new QuestionnaireController();
    transport = createTestBotTransport(app, [
      appController,
      courseController,
      streamController,
      questionnaireController,
    ]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    admin = (await app.userFacade.getUserByTelegramId(1005))!;
    advanced = (await app.userFacade.getUserByTelegramId(1007))!;
    notAdvanced = (await app.userFacade.getUserByTelegramId(1008))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Хелперы ──

  /**
   * Ожидает, пока probe не вернёт значение. Проактивное приглашение
   * доставляется асинхронно (fire-and-forget eventBus) — ждём poll-ом
   * с таймаутом, а не «сном наугад».
   */
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

  /** Проактивное сообщение пользователю с подстрокой в тексте. */
  function waitForSent(
    tgId: number,
    textContains: string,
  ): Promise<SentMessage> {
    return waitFor(`приглашение «${textContains}» для ${tgId}`, () =>
      transport.api.sentMessages.find(
        (m) => m.telegramId === tgId && m.text.includes(textContains),
      ),
    );
  }

  /** Создаёт поток от ментора (открытие набора → рассылка приглашений). */
  async function createStream(
    actor: User,
    moduleId: string,
    title: string,
  ): Promise<Stream> {
    return app.apiApp.execute(
      'create-stream',
      {
        title,
        description: 'Поток, открытый в e2e-тесте приглашения',
        mentorId: actor.uuid,
        moduleId,
        startDate: '2026-10-01T10:00',
        enrollmentKey: 'e2e-invite-key',
      },
      actor.uuid,
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

  function buttonsOf(response: BotResponse | null): Array<{
    text: string;
    code: string;
  }> {
    return response?.sendMessage?.keyboard?.rows.flat() ?? [];
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

  /** Статусы желаний пользователя на цель (по репозиторию). */
  async function wishStatuses(
    user: User,
    target: WishTarget,
  ): Promise<string[]> {
    return (await app.wishRepo.findAllByUserAndTarget(user.uuid, target)).map(
      (w) => w.status,
    );
  }

  /** apply — кнопка «Хочу пройти курс» в карточке курса. */
  function apply(tgId: number, courseId: string): Promise<BotResponse | null> {
    return transport.handleCallback(
      transport.makeBotContext(tgId, {
        callbackData: `course:course-catalog:apply:${courseId}`,
      }),
    );
  }

  // ── Course-ветка: полный пользовательский цикл ──

  test('course: apply → приглашение → «Открыть поток» → «Отменить желание» → cancelled', async () => {
    // 1. Гость выражает желание на курс (instant — W03 «зафиксировано»)
    const w03 = await apply(guest.telegramId, INSTANT_COURSE_ID);
    assertBotResponseValid(w03);
    expect(w03?.sendMessage?.text).toContain('зафиксировано');

    // 2. Ментор открывает набор — поток на стартовый модуль курса
    await createStream(mentor, FIRST_MODULE_ID, 'JS Core приглашение');

    // 3. Проактивное приглашение (S11): текст course-ветки, поток, дата,
    //    ментор без nick (просто имя), подсказка про ключ
    const invite = await waitForSent(
      guest.telegramId,
      'Открылся набор на курс',
    );
    assertBotResponseValid(asBotResponse(invite));
    expect(invite.text).toContain('Открылся набор на курс');
    expect(invite.text).not.toContain('открылся набор на модуль');
    expect(invite.text).toContain('JS Core приглашение');
    expect(invite.text).toContain('Старт: 01\\.10\\.2026');
    expect(invite.text).toContain('Ментор: Ментор');
    expect(invite.text).not.toContain('https://t.me/');
    expect(invite.text).toContain('ключ зачисления');

    // Кнопки: «Открыть поток» — на экран потока; «Отменить желание» — W05
    // (коды кнопок содержат сжатые UUID — маршрут проверяем кликом)
    const btns = invite.keyboard?.rows.flat() ?? [];
    const openBtn = btns.find((b) => b.text === '📚 Открыть поток');
    const cancelBtn = btns.find((b) => b.text === '🗑️ Отменить желание');
    expect(openBtn).toBeDefined();
    expect(cancelBtn).toBeDefined();

    // 4. «📚 Открыть поток» → карточка потока (S02) с записью по ключу
    const card = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: openBtn!.code,
      }),
    );
    assertBotResponseValid(card);
    expect(card?.sendMessage?.text).toContain('JS Core приглашение');
    expect(card?.sendMessage?.text).toContain('Набор открыт');
    expect(buttonsOf(card).some((b) => b.text === '📝 Записаться')).toBe(true);

    // 5. «🗑️ Отменить желание» → W05: подтверждение отмены ИМЕННО этого курса
    const w05screen = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: cancelBtn!.code,
      }),
    );
    assertBotResponseValid(w05screen);
    expect(w05screen?.sendMessage?.text).toContain(
      'Отменить желание пройти курс?',
    );
    expect(buttonsOf(w05screen).some((b) => b.text === '✅ Да')).toBe(true);

    // 6. «✅ Да» → желание отменено (по репозиторию)
    const w05 = await click(guest.telegramId, w05screen, '✅ Да');
    assertBotResponseValid(w05);
    expect(w05?.sendMessage?.text).toContain('Желание пройти курс отменено');
    expect(
      await wishStatuses(guest, {
        kind: 'course',
        courseId: INSTANT_COURSE_ID,
      }),
    ).toContain('cancelled');
  });

  // ── Ментор-строка: nick → кликабельная t.me-ссылка ──

  test('ментор с nick: в приглашении кликабельная t.me-ссылка', async () => {
    // Админ регистрирует ментора с ником (как в бою — профиль из Telegram)
    const nickMentor = await app.apiApp.execute(
      'register-guest',
      { telegramId: 2101, name: 'Николай', nick: 'u7_mentor_nick' },
      admin.uuid,
    );
    await app.apiApp.execute(
      'add-role-to-user',
      { userId: nickMentor.uuid, role: Role.MENTOR },
      admin.uuid,
    );

    // Пользователь желает курс «Основы программирования» (стартовый a0a0a0a0)
    const w03 = await apply(advanced.telegramId, TWO_MODULE_COURSE_ID);
    expect(w03?.sendMessage?.text).toContain('зафиксировано');

    await createStream(
      nickMentor as unknown as User,
      FIRST_MODULE_ID,
      'Поток никнутого ментора',
    );

    const invite = await waitForSent(
      advanced.telegramId,
      'Открылся набор на курс',
    );
    assertBotResponseValid(asBotResponse(invite));
    expect(invite.text).toContain('Поток никнутого ментора');
    // nick → кликабельная ссылка; внешние скобки экранированы (MarkdownV2)
    expect(invite.text).toContain('Ментор: Николай');
    expect(invite.text).toContain(
      '\\([@u7\\_mentor\\_nick](https://t.me/u7_mentor_nick)\\)',
    );
  });

  // ── Module-ветка: полный пользовательский цикл (W05-M) ──

  test('module: «Хочу пройти модуль» → приглашение → отмена (W05-M) → cancelled', async () => {
    // 1. Пользователь выражает желание на второй модуль курса
    const recorded = await transport.handleCallback(
      transport.makeBotContext(notAdvanced.telegramId, {
        callbackData: `course:course-catalog:wish:${SECOND_MODULE_ID}`,
      }),
    );
    assertBotResponseValid(recorded);
    expect(recorded?.sendMessage?.text).toContain('Записали');
    expect(recorded?.sendMessage?.text).toContain(
      'когда откроется набор на модуль',
    );

    // 2. Ментор открывает набор на этот же (не первый) модуль:
    //    course-ветка молчит, module-ветка зовёт
    await createStream(mentor, SECOND_MODULE_ID, 'Модульный поток');

    // 3. Приглашение с module-заголовком
    const invite = await waitForSent(
      notAdvanced.telegramId,
      'Открылся набор на модуль',
    );
    assertBotResponseValid(asBotResponse(invite));
    expect(invite.text).not.toContain('Открылся набор на курс');
    expect(invite.text).toContain('Модульный поток');

    // Кнопка отмены — маршрут W05-M по id модуля из желания
    // (код содержит сжатый UUID — маршрут проверяем кликом по экрану)
    const btns = invite.keyboard?.rows.flat() ?? [];
    const cancelBtn = btns.find((b) => b.text === '🗑️ Отменить желание');
    expect(cancelBtn).toBeDefined();

    // 4. «🗑️ Отменить желание» → W05-M: подтверждение
    const w05mScreen = await transport.handleCallback(
      transport.makeBotContext(notAdvanced.telegramId, {
        callbackData: cancelBtn!.code,
      }),
    );
    assertBotResponseValid(w05mScreen);
    expect(w05mScreen?.sendMessage?.text).toContain(
      'Отменить желание пройти модуль?',
    );

    // 5. «✅ Да» → желание отменено (по репозиторию)
    const w05m = await click(notAdvanced.telegramId, w05mScreen, '✅ Да');
    assertBotResponseValid(w05m);
    expect(w05m?.sendMessage?.text).toContain('Желание пройти модуль отменено');
    expect(
      await wishStatuses(notAdvanced, {
        kind: 'module',
        moduleId: SECOND_MODULE_ID,
      }),
    ).toContain('cancelled');
  });
});
