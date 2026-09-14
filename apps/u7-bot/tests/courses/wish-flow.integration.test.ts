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
import type { DialogResponse } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  stampedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import type { WishStatus } from '@u7-scl/wish/domain';

/**
 * Интеграционный тест wish-флоу (ветка A — instant):
 *   apply → W03 → повторный apply → W04 → cancel → confirm → W05
 *
 * Контракт «Диалог и Экран»: ассерты — по DialogResponse, захваченному
 * на границе uiApp. Реальный ApiApp (wish-модуль включён) + реальный
 * CoursesController. Коды прямых вызовов штампуются актуальным штампом
 * открытого экрана; клики по кнопкам ответа — тот же штамп (внутри
 * одной стори seq не меняется). Статусы проверяются по wishRepo.
 */
describe('Wish: жизненный цикл желания курса (интеграционный)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let guest: User;
  let author: User;

  const INSTANT_COURSE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  // Published-фикстурный курс с опасным названием (MarkdownV2), без пула
  const DANGEROUS_COURSE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  // Начало опасного названия в экранированном виде (esc: . ( ) ! + = { } | ~)
  const ESCAPED_DANGEROUS_PREFIX = 'Опас\\. Название \\(v9\\.9\\)';
  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

  beforeAll(async () => {
    app = await createTestApp('wish-flow');
    const courseController = new CoursesController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    transport = createTestBotTransport(app, [appController, courseController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    author = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Хелперы ──

  /** Открывает диалог гостя (актуальный штамп для нажатий). */
  async function openDialog(): Promise<void> {
    await transport.handleStart(transport.makeBotContext(guest.telegramId));
  }

  /** Создаёт draft-курс с модулем и этапом (для проверки карточки). */
  async function createDraftCourseWithModule(title: string): Promise<string> {
    const course = await app.apiApp.execute(
      'create-course',
      { title, description: 'Интеграционный тест' },
      author,
    );
    const mod = await app.apiApp.execute(
      'create-module',
      { title: 'Модуль', description: 'Тестовый модуль' },
      author,
    );
    await app.apiApp.execute('publish-module', { moduleId: mod.uuid }, author);
    await app.apiApp.execute(
      'add-phase-to-course',
      { courseId: course.uuid, title: 'Этап 1', track: 'tech' },
      author,
    );
    await app.apiApp.execute(
      'add-module-to-course',
      { courseId: course.uuid, phaseTitle: 'Этап 1', moduleId: mod.uuid },
      author,
    );
    return course.uuid;
  }

  /** Прямой callback «Хочу пройти курс»: сырой код + актуальный штамп. */
  async function apply(courseId: string): Promise<DialogResponse> {
    return transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: stampedCode(
          transport,
          guest.telegramId,
          `course:course-catalog:apply:${courseId}`,
        ),
      }),
    );
  }

  /** Клик по кнопке последнего ответа (код raw, штамп — текущий экран). */
  async function click(
    response: DialogResponse,
    buttonText: string,
  ): Promise<DialogResponse> {
    const btn = buttonsOf(response).find((b) => b.text === buttonText);
    expect(btn, `Кнопка «${buttonText}» не найдена в ответе`).toBeDefined();
    return transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: stampedCode(transport, guest.telegramId, btn!.code),
      }),
    );
  }

  function hasButton(response: DialogResponse, text: string): boolean {
    return buttonsOf(response).some((b) => b.text.includes(text));
  }

  function buttonsOf(
    response: DialogResponse,
  ): Array<{ text: string; code: string }> {
    return response.screen?.keyboard?.rows.flat() ?? [];
  }

  /**
   * Все статусы желаний гостя на курс. Порядок записей в файле при равных
   * createdAt недетерминирован, поэтому проверяем набор, а не «последнюю».
   */
  async function wishStatuses(courseId: string): Promise<WishStatus[]> {
    return (
      await app.wishRepo.findAllByUserAndTarget(guest.uuid, {
        kind: 'course',
        courseId,
      })
    ).map((w) => w.status);
  }

  /** Изоляция тестов: гасит активные желания гостя (cancelled не мешает созданию). */
  async function deactivateWishes(): Promise<void> {
    for (const w of await app.wishRepo.getByUser(guest.uuid)) {
      if (w.status !== 'cancelled' && w.status !== 'fulfilled') {
        await app.wishRepo.save({ ...w, status: 'cancelled' });
      }
    }
  }

  /** apply → cancel → «✅ Да»: возвращает W05-ответ (желание cancelled). */
  async function applyAndCancel(courseId: string): Promise<DialogResponse> {
    await apply(courseId);
    const w04 = await apply(courseId);
    expect(w04.screen?.text).toContain('уже выразил');
    const confirmScreen = await click(w04, '🗑️ Отменить желание');
    return click(confirmScreen, '✅ Да');
  }

  // ── A1: apply → W03 ──

  test('apply instant-курса → W03 «зафиксировано», в репо expressed', async () => {
    await deactivateWishes();
    await openDialog();

    const response = await apply(INSTANT_COURSE_ID);
    expect(response.screen?.text).toContain('зафиксировано');
    expect(hasButton(response, 'Главное меню')).toBe(true);

    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('expressed');
  });

  // ── A2: повторный apply → W04 expressed ──

  test('повторный apply → W04 «уже выразил» с кнопкой отмены желания', async () => {
    await deactivateWishes();
    await openDialog();
    await apply(INSTANT_COURSE_ID);

    const response = await apply(INSTANT_COURSE_ID);
    expect(response.screen?.text).toContain('уже выразил');
    expect(hasButton(response, '🗑️ Отменить желание')).toBe(true);

    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('expressed');
  });

  // ── A3: cancel-экран, «❌ Отмена» возвращает в карточку без изменений ──

  test('cancel: экран подтверждения; «❌ Отмена» → карточка курса, статус прежний', async () => {
    await deactivateWishes();
    await openDialog();
    await apply(INSTANT_COURSE_ID);
    const w04 = await apply(INSTANT_COURSE_ID);

    const confirmScreen = await click(w04, '🗑️ Отменить желание');
    expect(confirmScreen.screen?.text).toContain(
      'Отменить желание пройти курс?',
    );
    expect(hasButton(confirmScreen, '✅ Да')).toBe(true);
    expect(hasButton(confirmScreen, '❌ Отмена')).toBe(true);
    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('expressed');

    const card = await click(confirmScreen, '❌ Отмена');
    expect(card.screen?.text).toContain('Курс: Продвинутый JavaScript');
    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('expressed');
  });

  // ── A4: «✅ Да» → W05, повторное желание возможно ──

  test('cancel: «✅ Да» → «отменено», в репо cancelled; apply после отмены → W03', async () => {
    await deactivateWishes();
    await openDialog();

    const w05 = await applyAndCancel(INSTANT_COURSE_ID);
    expect(w05.screen?.text).toContain('отменено');
    expect(hasButton(w05, 'Главное меню')).toBe(true);
    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('cancelled');
    expect(await wishStatuses(INSTANT_COURSE_ID)).not.toContain('expressed');

    const again = await apply(INSTANT_COURSE_ID);
    expect(again.screen?.text).toContain('зафиксировано');
    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('expressed');
  });

  // ── A5: двойное подтверждение (устаревший экран) ──

  test('двойное «✅ Да» (устаревший экран) → мягкое «уже нет», статус не меняется', async () => {
    await deactivateWishes();
    await openDialog();
    await apply(INSTANT_COURSE_ID);
    const w04 = await apply(INSTANT_COURSE_ID);
    const confirmScreen = await click(w04, '🗑️ Отменить желание');
    await click(confirmScreen, '✅ Да');
    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('cancelled');

    // Повторный клик по той же кнопке «✅ Да» (устаревший cancel-confirm):
    // активного желания уже нет — мягкое сообщение вместо ошибки
    const stale = await click(confirmScreen, '✅ Да');
    expect(stale.screen?.text).toContain('уже нет');
    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('cancelled');
    expect(await wishStatuses(INSTANT_COURSE_ID)).not.toContain('expressed');
  });

  // ── A6: W04 confirmed ──

  test('confirmed-желание → W04 «обучаешься»; отмена из confirmed → cancelled', async () => {
    await deactivateWishes();
    await openDialog();
    await apply(INSTANT_COURSE_ID);
    // Переводим свежее желание в confirmed напрямую через репозиторий
    const wishes = await app.wishRepo.findAllByUserAndTarget(guest.uuid, {
      kind: 'course',
      courseId: INSTANT_COURSE_ID,
    });
    const expressed = wishes.find((w) => w.status === 'expressed');
    expect(expressed).toBeDefined();
    await app.wishRepo.save({ ...expressed!, status: 'confirmed' });

    const response = await apply(INSTANT_COURSE_ID);
    expect(response.screen?.text).toContain('обучаешься');
    expect(hasButton(response, '🗑️ Отменить желание')).toBe(true);

    const confirmScreen = await click(response, '🗑️ Отменить желание');
    const w05 = await click(confirmScreen, '✅ Да');
    expect(w05.screen?.text).toContain('отменено');
    expect(await wishStatuses(INSTANT_COURSE_ID)).toContain('cancelled');
    expect(await wishStatuses(INSTANT_COURSE_ID)).not.toContain('confirmed');
  });

  // ── A7: экранирование опасного названия ──

  test('опасное название курса — все экраны markdown-safe', async () => {
    await deactivateWishes();
    await openDialog();

    // Карточка draft-курса с опасным названием (создан через create-course)
    const draftId = await createDraftCourseWithModule(
      'Чернов. Курс (v1.0) - #3! Draft+тест=ок {draft} |дерево| ~волна~',
    );

    const draftCard = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: stampedCode(
          transport,
          guest.telegramId,
          `course:course-catalog:phases:${draftId}`,
        ),
      }),
    );
    expect(draftCard.screen?.text).toContain('Чернов\\. Курс \\(v1\\.0\\)');

    // Каталог (list): опасное название published-курса — markdown-safe
    const list = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: stampedCode(
          transport,
          guest.telegramId,
          'course:course-catalog:list',
        ),
      }),
    );
    expect(list.screen?.text).toContain(ESCAPED_DANGEROUS_PREFIX);

    // Полный wish-цикл на published-курсе с опасным названием
    const card = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: stampedCode(
          transport,
          guest.telegramId,
          `course:course-catalog:phases:${DANGEROUS_COURSE_ID}`,
        ),
      }),
    );
    expect(card.screen?.text).toContain(ESCAPED_DANGEROUS_PREFIX);

    const w03 = await apply(DANGEROUS_COURSE_ID);
    expect(w03.screen?.text).toContain('зафиксировано');

    const w04 = await apply(DANGEROUS_COURSE_ID);
    expect(w04.screen?.text).toContain('уже выразил');

    const confirmScreen = await click(w04, '🗑️ Отменить желание');
    const w05 = await click(confirmScreen, '✅ Да');
    expect(w05.screen?.text).toContain('отменено');
    expect(await wishStatuses(DANGEROUS_COURSE_ID)).toContain('cancelled');
  });
});
