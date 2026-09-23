import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { AppController } from '@u7-scl/bot/app/app-controller';
import type { StudentCompletedEvent } from '@u7-scl/stream/domain';
import { createTestApp, type TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { PeerReviewController } from '../../src/controllers/peer-review/controller';

/**
 * E2E «Отзывы мне» (S08):
 *
 *   1) отзывов нет → в хабе кнопки «📥 Отзывы мне» нет (Олег — кампания
 *      создана событием судьбы в рантайме, окно 7 дн от «сейчас»);
 *   2) после create-review кнопка в хабе появляется; S08: новые наверху
 *      (свежий отзыв Олега выше фиксурного от Андрея), карточки-отзывы
 *      разделены линией, лейбл исхода у автора-студента; «↩️ Мои
 *      отзывы» возвращает в хаб;
 *   3) меню: живых кампаний нет, но отзывы есть → кнопка «💬 Отзывы»
 *      видна (Бот-админ — фиксурный отзыв -0004, ни в одной кампании);
 *      негатив «нет ни того, ни другого» — покрыт в peer-review-hub
 *      («Кандидат»).
 */

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'; // «JS Core — Поток 2»
const MODULE_ID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';
const MARINA_TG = 1007; // «Марина» — адресат фиксурного отзыва Андрея
const MARINA_ID = '77777777-7777-4777-8777-777777777777';
const OLEG_TG = 1008; // «Олег» — студент потока, без фиксурных отзывов
const OLEG_ID = '88888888-8888-4888-8888-888888888888';
const MENTOR_TG = 1004; // «Ментор» — пишет Марине свежий отзыв (S08)
const MENTOR_ID = '44444444-4444-4444-4444-444444444444';
const BOT_ADMIN_TG = 8781337572; // адресат фиксурного отзыва -0004
const FIXTURE_REVIEW_TEXT = 'Работать в паре было легко';
// Без двоеточий/дефисов — MarkdownV2 экранирует спецсимволы в данных
const NEW_REVIEW_TEXT = 'Свежий отзыв за новый поток';

/** Ждёт условия (poll) — ER обрабатывает событие асинхронно. */
async function waitUntil(
  probe: () => boolean | Promise<boolean>,
  timeoutMs = 3000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
}

/** Событие судьбы студента потока (исход «завершил и прошел»). */
function completedEvent(userId: string, aggregateId: string) {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.completed',
    occurredAt: '2026-09-22T12:00',
    aggregateName: 'Student',
    aggregateId,
    payload: {
      studentId: aggregateId,
      userId,
      streamId: STREAM_ID,
      moduleId: MODULE_ID,
      outcome: 'advanced',
    },
  } satisfies StudentCompletedEvent;
}

/** isoMinute «сейчас ± сдвиг» — формат окна кампании. */
function isoMinute(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString().slice(0, 16);
}

/** /start → хаб по кнопке меню «💬 Отзывы». */
async function openHub(transport: TestBotTransport, tgId: number) {
  await transport.handleStart(transport.makeBotContext(tgId));
  return transport.handleCallback(
    transport.makeBotContext(tgId, {
      callbackData: pressedCode(transport, tgId, '💬 Отзывы'),
    }),
  );
}

describe('E2E peer-review: S08 «Отзывы мне»', () => {
  let app: TestApp;
  let transport: TestBotTransport;

  beforeAll(async () => {
    app = await createTestApp('pr-s08');
    transport = createTestBotTransport(app, [
      new AppController(SCHOOL_GROUP_URL),
      new PeerReviewController(),
    ]);

    // Живая кампания Марины — событием судьбы (как в бою); кампания
    // Олега — напрямую в репо (субъект без отзывов для негативного кейса)
    app.eventBus.publish(
      completedEvent(MARINA_ID, 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1'),
    );
    await waitUntil(async () =>
      Boolean(await app.reviewCampaignRepo.findBySubject(STREAM_ID, MARINA_ID)),
    );
    await app.reviewCampaignRepo.save({
      uuid: 'c5a55555-5555-4555-8555-555555555555',
      context: 'stream_fate',
      scopeId: STREAM_ID,
      subjectId: OLEG_ID,
      createdAt: isoMinute(),
      expiresAt: isoMinute(7 * 24 * 3600 * 1000),
      participants: [],
      payload: {
        subjectOutcome: 'completed_passed',
        mentorId: '44444444-4444-4444-4444-444444444444',
      },
    });
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('отзывов нет → в хабе нет кнопки «📥 Отзывы мне»', async () => {
    const hub = await openHub(transport, OLEG_TG);

    const text = String(hub.screen?.text);
    expect(text).toContain('💬 *Мои отзывы*');
    const btns = hub.screen?.keyboard?.rows.flat() ?? [];
    expect(btns.some((b) => b.text === '📥 Отзывы мне')).toBe(false);
  });

  test('отзыв появился → кнопка есть; S08: новые наверху, линия, лейблы, возврат', async () => {
    const oleg = (await app.userFacade.getUserByTelegramId(OLEG_TG))!;
    const marina = (await app.userFacade.getUserByTelegramId(MARINA_TG))!;
    const mentor = (await app.userFacade.getUserByTelegramId(MENTOR_TG))!;
    const campaign = (await app.reviewCampaignRepo.findBySubject(
      STREAM_ID,
      MARINA_ID,
    ))!;
    // Свежий отзыв ментора → Марина (createdAt «сейчас» > фиксурного);
    // писать субъекту окна может субъект или ментор — берём ментора
    await app.apiApp.execute(
      'create-review',
      {
        campaignId: campaign.uuid,
        authorId: mentor.uuid,
        recipientId: marina.uuid,
        text: NEW_REVIEW_TEXT,
      },
      mentor,
    );

    const hub = await openHub(transport, MARINA_TG);
    const hubBtns = hub.screen?.keyboard?.rows.flat() ?? [];
    expect(hubBtns.some((b) => b.text === '📥 Отзывы мне')).toBe(true);

    // Штампованный код кнопки — из записанного экрана (как реальный клиент)
    const s08 = await transport.handleCallback(
      transport.makeBotContext(MARINA_TG, {
        callbackData: pressedCode(transport, MARINA_TG, 'Отзывы мне'),
      }),
    );
    const text = String(s08.screen?.text);
    expect(text).toContain('📥 *Отзывы мне*');
    expect(text).toContain('2 отзыва от участников');

    // Новые наверху: свежий отзыв Олега выше фиксурного от Андрея
    const fresh = text.indexOf(`«${NEW_REVIEW_TEXT}`);
    const stale = text.indexOf(FIXTURE_REVIEW_TEXT);
    expect(fresh).toBeGreaterThan(-1);
    expect(stale).toBeGreaterThan(fresh);

    // Карточки разделены линией — ровно одна на два отзыва
    expect(text.split('──────────────').length - 1).toBe(1);

    // Роли и лейблы: автор-ментор — без исхода; автор-студент — с исходом
    expect(text).toContain('👤 Ментор \\(ментор ·');
    expect(text).toContain('👤 Андрей \\(студент · завершил и прошел');

    // Возврат «↩️ Мои отзывы» → хаб S02
    const hub2 = await transport.handleCallback(
      transport.makeBotContext(MARINA_TG, {
        callbackData: pressedCode(transport, MARINA_TG, 'Мои отзывы'),
      }),
    );
    expect(String(hub2.screen?.text)).toContain('💬 *Мои отзывы*');
  });

  test('меню: живых кампаний нет, но отзывы есть → кнопка «💬 Отзывы» видна', async () => {
    const botAdmin = (await app.userFacade.getUserByTelegramId(BOT_ADMIN_TG))!;

    const menu = await transport.collectMainMenu(botAdmin);

    expect(menu.some((b) => b.text === '💬 Отзывы')).toBe(true);
  });
});
