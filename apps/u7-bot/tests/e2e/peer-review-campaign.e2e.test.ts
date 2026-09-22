import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { StudentCompletedEvent } from '@u7-scl/stream/domain';
import { createTestApp, type TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { PeerReviewController } from '../../src/controllers/peer-review/controller';

/**
 * E2E «Судьба субъекта — написание» (Фаза 6, задача 2): сквозной путь
 * субъекта от события судьбы до перезаписи отзыва.
 *
 *   student.completed → кампания (адресация v4) → два приглашения
 *   (субъекту и ментору, тексты по subjectOutcome) → клик субъекту →
 *   S03 (шапка, дни, ✅ нет) → короткий текст — переспрос → корректный
 *   ввод → S06 (✅ появился) → перезапись S04 (текст заменён).
 *
 * Один сквозной тест: сценарий stateful по природе (каждый шаг жмёт
 * кнопку предыдущего экрана — как реальный клиент).
 */

const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'; // «JS Core — Поток 2»
const STREAM_TITLE = 'JS Core — Поток 2';
const SUBJECT_TG = 1007; // «Марина» — субъект новой кампании
const SUBJECT_USER_ID = '77777777-7777-4777-8777-777777777777';
const MENTOR_TG = 1004; // «Ментор» — ментор потока и адресат
const MENTOR_USER_ID = '44444444-4444-4444-4444-444444444444';

const GOOD_TEXT = 'Ментор спокойно разбирал мои ошибки и не давал застрять.';
const GOOD_TEXT_2 = 'Вторая правка: ментор был внимателен к деталям.';

/** Ждёт условия (poll) — ER и стори обрабатывают событие асинхронно. */
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

describe('E2E peer-review: судьба субъекта — написание', () => {
  let app: TestApp;
  let transport: TestBotTransport;

  beforeAll(async () => {
    app = await createTestApp('pr-campaign');
    transport = createTestBotTransport(app, [new PeerReviewController()]);
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('событие судьбы → приглашения → S03 → ввод → S06 → перезапись S04', async () => {
    // ── 1. Событие судьбы: завершил и прошел ──
    app.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventName: 'student.completed',
      occurredAt: '2026-09-22T12:00',
      aggregateName: 'Student',
      aggregateId: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
      payload: {
        studentId: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
        userId: SUBJECT_USER_ID,
        streamId: STREAM_ID,
        moduleId: 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0',
        outcome: 'advanced',
      },
    } satisfies StudentCompletedEvent);

    // ── 2. Два приглашения: субъекту (по исходу) и ментору (с именем) ──
    await waitUntil(
      () =>
        transport.api.sentMessages.some((m) => m.telegramId === SUBJECT_TG) &&
        transport.api.sentMessages.some((m) => m.telegramId === MENTOR_TG),
    );

    const subjectInvite = transport.api.sentMessages.find(
      (m) => m.telegramId === SUBJECT_TG,
    );
    expect(subjectInvite?.text).toContain(STREAM_TITLE);
    // Судьба проговаривается мягко, текст — про одногруппников и ментора
    expect(subjectInvite?.text).toContain('Ты завершил обучение');
    expect(subjectInvite?.text).toContain('об одногруппниках и менторе');

    const mentorInvite = transport.api.sentMessages.find(
      (m) => m.telegramId === MENTOR_TG,
    );
    expect(mentorInvite?.text).toContain(
      'Твой подопечный Марина завершил обучение — выдай ему отзыв',
    );

    // Полный код кнопки в обоих приглашениях
    const subjectBtn = subjectInvite?.keyboard?.rows.flat()[0];
    expect(subjectBtn?.text).toBe('💬 Отзывы');
    expect(subjectBtn?.code).toStartWith('peer-review:campaign:list:');
    expect(
      mentorInvite?.keyboard?.rows
        .flat()[0]
        ?.code.startsWith('peer-review:campaign:list:'),
    ).toBe(true);

    // ── 3. Клик субъекту из приглашения → S03 ──
    const s03 = await transport.handleCallback(
      transport.makeBotContext(SUBJECT_TG, { callbackData: subjectBtn!.code }),
    );
    expect(String(s03.screen?.text)).toContain(STREAM_TITLE);
    expect(String(s03.screen?.text)).toContain('О ком расскажешь?');
    expect(String(s03.screen?.text)).toContain(
      'Ты завершил обучение в этом потоке',
    );
    // Развёрнутые метрики: окно свежесозданной кампании — 7 дней
    expect(String(s03.screen?.text)).toContain('Написано отзывов: 0 из 3');
    expect(String(s03.screen?.text)).toContain('Осталось времени: 7 дн');
    const s03buttons = s03.screen?.keyboard?.rows.flat() ?? [];
    // Адресация v4: соученики (333, 888) + ментор, ✅ ещё нет
    expect(s03buttons.map((b) => b.text)).toEqual([
      'Одногруппник — Андрей',
      'Одногруппник — Олег',
      'Ментор — Ментор',
      '↩️ Главное меню',
    ]);

    // ── 4. Выбор ментора → S05 (подсказка по исходу автора) ──
    // Код кнопки — отштампованный транспорт-рендер последнего экрана
    const mentorBtnCode = pressedCode(transport, SUBJECT_TG, 'Ментор — Ментор');
    const s05 = await transport.handleCallback(
      transport.makeBotContext(SUBJECT_TG, { callbackData: mentorBtnCode }),
    );
    expect(String(s05.screen?.text)).toContain(
      'Начни со строки "Отзыв для ментора:"',
    );
    expect(String(s05.screen?.text)).toContain('что помогало учиться');
    expect(String(s05.screen?.text)).toContain('Моя рекомендация студентам:');
    // Принципы — общий блок экранов ввода + кнопка справки
    expect(String(s05.screen?.text)).toContain('Характеризуй навыки');
    const howBtn = s05.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Как писать отзыв'));
    expect(howBtn?.code).toStartWith('peer-review:campaign:how:');

    expect(s05.awaitInput).toBeDefined();

    // ── 5. Короткий текст — переспрос, контекст не теряется ──
    const warn = await transport.handleMessage(
      transport.makeBotContext(SUBJECT_TG, { text: 'коротко' }),
    );
    expect(String(warn.notify?.text ?? warn.screen?.text)).toContain(
      'Отзыв — от 10 символов',
    );
    expect(transport.dialogOf(SUBJECT_TG)?.input?.context).toEqual({
      campaignId: expect.any(String),
      recipientId: MENTOR_USER_ID,
    });

    // ── 6. Корректный ввод → S06: ✅ появился у ментора ──
    const s06 = await transport.handleMessage(
      transport.makeBotContext(SUBJECT_TG, { text: GOOD_TEXT }),
    );
    expect(String(s06.screen?.text)).toContain('Отзыв о Ментор сохранён');
    expect(String(s06.screen?.text)).toContain('О ком ещё рассказать?');
    const s06buttons = s06.screen?.keyboard?.rows.flat() ?? [];
    expect(s06buttons.map((b) => b.text)).toEqual([
      'Одногруппник — Андрей',
      'Одногруппник — Олег',
      '✅Ментор — Ментор',
      '↩️ Главное меню',
    ]);

    // ── 7. Перезапись: клик ✅ ментора → S04 с текущим текстом ──
    const rewriteBtnCode = pressedCode(
      transport,
      SUBJECT_TG,
      '✅Ментор — Ментор',
    );
    const s04 = await transport.handleCallback(
      transport.makeBotContext(SUBJECT_TG, {
        callbackData: rewriteBtnCode,
      }),
    );
    expect(String(s04.screen?.text)).toContain('Ты уже писал');
    expect(String(s04.screen?.text)).toContain('о Ментор');
    expect(String(s04.screen?.text)).toContain(
      '«Ментор спокойно разбирал мои ошибки и не давал застрять',
    );
    expect(String(s04.screen?.text)).toContain('он заменит текущий');
    expect(s04.screen?.keyboard?.rows.flat()[0]?.text).toBe('❌ Назад');

    // ── 8. Новый текст заменяет старый ──
    const s06b = await transport.handleMessage(
      transport.makeBotContext(SUBJECT_TG, { text: GOOD_TEXT_2 }),
    );
    expect(String(s06b.screen?.text)).toContain('Отзыв о Ментор сохранён');

    const subject = (await app.userFacade.getUserByTelegramId(SUBJECT_TG))!;
    const campaign = await app.reviewCampaignRepo.findBySubject(
      STREAM_ID,
      SUBJECT_USER_ID,
    );
    const my = await app.apiApp.execute(
      'get-my-review',
      {
        campaignId: campaign!.uuid,
        authorId: subject.uuid,
        recipientId: MENTOR_USER_ID,
      },
      subject,
    );
    expect(my.found).toBe(true);
    expect(my.text).toBe(GOOD_TEXT_2);
  });
});
