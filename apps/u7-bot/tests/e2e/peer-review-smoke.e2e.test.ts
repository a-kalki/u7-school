import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { StudentCompletedEvent } from '@u7-scl/stream/domain';
import { createTestApp, type TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { PeerReviewController } from '../../src/controllers/peer-review/controller';

/**
 * Smoke сквозной склейки peer-review на тестовом стенде (Фаза 6, задача 1):
 * TestApp подключает PeerReviewApiModule на фикстурах peer-review/*,
 * ER создания кампании подписан на события судьбы студента общей шиной,
 * сторя приглашений работает на реальной шине.
 *
 *   1) модуль зарегистрирован — UC get-my-campaigns отвечает (не NO_COMMAND_FOUND);
 *   2) student.completed → кампания создаётся (репозиторий + UC);
 *   3) student-campaign.created → два приглашения (субъекту и ментору)
 *      с полным кодом кнопки `💬 Отзывы`.
 *
 * Субъект — «Студент Advanced» (uuid 777…): его исхода нет в фикстурах
 * кампаний (кампании фикстур — субъекты 333…/444…/888…), поэтому
 * событие судьбы создаёт НОВУЮ кампанию, а не упирается в идемпотентность ER.
 */

const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'; // JS Core — Поток 2
const SUBJECT_TG = 1007; // «Студент Advanced»
const SUBJECT_USER_ID = '77777777-7777-4777-8777-777777777777';
const MENTOR_TG = 1004; // «Ментор» — ментор потока e1e1e1e1

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

describe('E2E peer-review: инфраструктура стенда (smoke)', () => {
  let app: TestApp;
  let transport: TestBotTransport;

  beforeAll(async () => {
    app = await createTestApp('pr-smoke');
    transport = createTestBotTransport(app, [new PeerReviewController()]);
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('модуль peer-review зарегистрирован — get-my-campaigns отвечает', async () => {
    const mentor = (await app.userFacade.getUserByTelegramId(MENTOR_TG))!;
    // Без модуля execute кинет NO_COMMAND_FOUND
    const cards = await app.apiApp.execute(
      'get-my-campaigns',
      { userId: mentor.uuid },
      mentor,
    );
    expect(Array.isArray(cards)).toBe(true);
    // Фикстура c1a11111: субъект 333…, ментор 444… — кампания живая на дату фикстур,
    // но isExpired(now) от реального «сейчас» → onlyLives может быть пуст;
    // без фильтра кампания ментора обязана найтись.
    expect(
      cards.some(
        (c) => c.campaignId === 'c1a11111-1111-4111-8111-111111111111',
      ),
    ).toBe(true);
  });

  test('student.completed → ER создаёт кампанию (репозиторий + UC)', async () => {
    transport.reset();

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

    // Кампания появилась в репозитории
    await waitUntil(async () => {
      const campaign = await app.reviewCampaignRepo.findBySubject(
        STREAM_ID,
        SUBJECT_USER_ID,
      );
      return campaign !== undefined;
    });
    const campaign = await app.reviewCampaignRepo.findBySubject(
      STREAM_ID,
      SUBJECT_USER_ID,
    );
    expect(campaign).toBeDefined();
    // Формат v4: адресация по исходу субъекта, ментор — соавтор
    expect(campaign?.payload.subjectOutcome).toBe('completed_passed');
    expect(campaign?.payload.mentorId).toBe(
      '44444444-4444-4444-4444-444444444444',
    );
    // Соученики потока без abandoned и без субъекта
    expect(campaign?.participants).toEqual([
      '33333333-3333-3333-3333-333333333333',
      '88888888-8888-4888-8888-888888888888',
    ]);

    // UC видит кампанию и субъекту, и ментору
    const subject = (await app.userFacade.getUserByTelegramId(SUBJECT_TG))!;
    const subjectCards = await app.apiApp.execute(
      'get-my-campaigns',
      { userId: subject.uuid },
      subject,
    );
    expect(subjectCards.some((c) => c.campaignId === campaign?.uuid)).toBe(
      true,
    );
  });

  test('student-campaign.created → приглашения субъекту и ментору на реальной шине', async () => {
    // Событие опубликовано ER в предыдущем тесте — ждём доставку приглашений
    await waitUntil(
      () =>
        transport.api.sentMessages.some((m) => m.telegramId === SUBJECT_TG) &&
        transport.api.sentMessages.some((m) => m.telegramId === MENTOR_TG),
    );

    const subjectMsg = transport.api.sentMessages.find(
      (m) => m.telegramId === SUBJECT_TG,
    );
    expect(subjectMsg?.text).toContain('🏁 *Отзывы по потоку');
    // Текст субъекту по исходу completed_passed — про одногруппников и ментора
    expect(subjectMsg?.text).toContain('об одногруппниках и менторе');
    const subjectBtn = subjectMsg?.keyboard?.rows.flat()[0];
    expect(subjectBtn?.text).toBe('💬 Отзывы');
    expect(subjectBtn?.code).toMatch(/^peer-review:campaign:list:/);

    const mentorMsg = transport.api.sentMessages.find(
      (m) => m.telegramId === MENTOR_TG,
    );
    // Ментору — с именем субъекта
    expect(mentorMsg?.text).toContain('отзыв для Студент Advanced');
    expect(mentorMsg?.keyboard?.rows.flat()[0]?.text).toBe('💬 Отзывы');
  });
});
