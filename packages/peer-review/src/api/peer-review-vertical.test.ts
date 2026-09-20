import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { User } from '@u7-scl/app';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { Logger } from '@u7-scl/core/shared';
import type {
  StreamMembers,
  StudentCompletedEvent,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import { ReviewCampaignJsonRepo } from '../infra/db/review-campaign-json-repo';
import { ReviewJsonRepo } from '../infra/db/review-json-repo';
import { PeerReviewApiModule } from './module';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const SUBJECT = '77777777-7777-4777-8777-777777777777';
const PEER = '22222222-2222-4222-8222-222222222222';
const MENTOR = '66666666-6666-4666-8666-666666666666';

/** Актор-заглушка: checkAuth проверяет только наличие. */
const ACTOR = { uuid: SUBJECT } as unknown as User;

/** Тихий логгер: вертикаль не должна сорить выводом тестов. */
const SILENT_LOGGER = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
} as unknown as Logger;

function completedEvent(): StudentCompletedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.completed',
    occurredAt: '2026-09-20T10:00',
    aggregateName: 'Student',
    aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    payload: {
      studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: SUBJECT,
      streamId: SCOPE,
      moduleId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      outcome: 'advanced',
    },
  };
}

function members(): StreamMembers {
  return {
    mentorId: MENTOR,
    students: [
      {
        userId: SUBJECT,
        status: 'advanced',
        neverStarted: false,
      },
      {
        userId: PEER,
        status: 'active',
        neverStarted: false,
      },
    ],
  };
}

/**
 * Собирает настоящую вертикаль: json-репозитории, шина in-proc,
 * ER create-student-campaign (через module.init) и пользовательские UC.
 * Фасад stream — стаб с составом потока.
 */
function makeVertical() {
  const eventBus = new InProcEventBus();
  const resolve: PeerReviewApiModuleResolver = {
    reviewCampaignRepo: new ReviewCampaignJsonRepo(join(dir, 'campaigns.json')),
    reviewRepo: new ReviewJsonRepo(join(dir, 'reviews.json')),
    streamFacade: {
      getMembers: mock(() => Promise.resolve(members())),
    } as unknown as PeerReviewApiModuleResolver['streamFacade'],
    appResolver: {
      logger: SILENT_LOGGER,
      mode: 'test' as const,
      eventBus,
    },
    eventBus,
  };

  const module = new PeerReviewApiModule(resolve);
  // init() подписывает ER на student.completed/student.abandoned
  module.init();
  return { module, eventBus, resolve };
}

/**
 * Шина InProc — fire-and-forget для async-обработчиков, поэтому состояние
 * после publish ждём поллингом (детерминированно, без sleep-магии).
 */
async function waitUntil<T>(
  probe: () => Promise<T | undefined>,
  timeoutMs = 1000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value !== undefined) return value;
    if (Date.now() > deadline) {
      throw new Error('waitUntil: состояние не наступило за отведённое время');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'u7-peer-review-vertical-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('Вертикаль peer-review: student.completed → ER → кампания → отзыв → чтение', () => {
  test('полный цикл: событие создаёт кампанию, отзывы пишутся и читаются', async () => {
    const { module, eventBus, resolve } = makeVertical();

    // Доменное событие агрегата ловим на шине
    const createdEvents: unknown[] = [];
    eventBus.subscribe('student-campaign.created', async (e) => {
      createdEvents.push(e);
    });

    // ── 1. Событие судьбы студента → ER создаёт кампанию ──
    eventBus.publish(completedEvent());

    const campaign = await waitUntil(() =>
      resolve.reviewCampaignRepo.findBySubject(SCOPE, SUBJECT),
    );
    expect(campaign).toBeDefined();
    expect(campaign?.context).toBe('stream_fate');
    // Форма: participants — только id адресуемых (ещё учащийся соученик)
    expect(campaign?.participants).toEqual([PEER]);
    expect(campaign?.payload).toEqual({
      subjectOutcome: 'completed_passed',
      mentorId: MENTOR,
    });
    // Событие агрегата опубликовано на шине
    expect(createdEvents).toHaveLength(1);

    // ── 2. Субъект пишет отзыв соученику в окне ──
    const saved = await module.execute(
      'create-review',
      {
        campaignId: campaign!.uuid,
        authorId: SUBJECT,
        recipientId: PEER,
        text: 'Держал темп до конца потока, помогал с вопросами',
      },
      ACTOR,
    );
    expect(saved.recipientId).toBe(PEER);

    // Ментор пишет отзыв субъекту
    const savedMentor = await module.execute(
      'create-review',
      {
        campaignId: campaign!.uuid,
        authorId: MENTOR,
        recipientId: SUBJECT,
        text: 'Стабильный результат и сильный финальный проект',
      },
      ACTOR,
    );
    expect(savedMentor.recipientId).toBe(SUBJECT);

    // ── 3. Чтение: мои кампании различают роли и прогресс ──
    const subjectCards = await module.execute(
      'get-my-campaigns',
      { userId: SUBJECT, onlyLives: true },
      ACTOR,
    );
    expect(subjectCards).toHaveLength(1);
    expect(subjectCards[0]!.myRole).toBe('subject');
    expect(subjectCards[0]!.progress).toEqual({ done: 1, total: 2 });

    const mentorCards = await module.execute(
      'get-my-campaigns',
      { userId: MENTOR, onlyLives: true },
      ACTOR,
    );
    expect(mentorCards).toHaveLength(1);
    expect(mentorCards[0]!.myRole).toBe('mentor');
    expect(mentorCards[0]!.progress).toEqual({ done: 1, total: 1 });

    // Деталка: адресаты субъекта с признаком «мой отзыв есть»
    const recipients = await module.execute(
      'get-campaign-recipients',
      { campaignId: campaign!.uuid, authorId: SUBJECT },
      ACTOR,
    );
    const peerView = recipients.recipients.find((r) => r.userId === PEER);
    expect(peerView?.hasMyReview).toBe(true);

    // Чтение скоупа: отзывы сгруппированы по адресатам
    const scopeReviews = await module.execute(
      'list-scope-reviews',
      { scopeId: SCOPE },
      ACTOR,
    );
    const byRecipient = new Map(
      scopeReviews.recipients.map((r) => [r.recipientId, r]),
    );
    expect(byRecipient.get(PEER)?.reviews).toHaveLength(1);
    expect(byRecipient.get(PEER)?.reviews[0]?.direction).toBe(
      'student_student',
    );
    expect(byRecipient.get(SUBJECT)?.reviews).toHaveLength(1);
    expect(byRecipient.get(SUBJECT)?.reviews[0]?.direction).toBe(
      'mentor_student',
    );
  });

  test('идемпотентность вертикали: повтор события не создаёт вторую кампанию', async () => {
    const { eventBus, resolve } = makeVertical();

    eventBus.publish(completedEvent());
    await waitUntil(() =>
      resolve.reviewCampaignRepo.findBySubject(SCOPE, SUBJECT),
    );

    eventBus.publish(completedEvent());
    // Даём повторной обработке завершиться — кампания должна остаться одна
    await new Promise((resolve) => setTimeout(resolve, 30));

    const all = await resolve.reviewCampaignRepo.findActiveBySubject(SUBJECT);
    expect(all).toHaveLength(1);
  });
});
