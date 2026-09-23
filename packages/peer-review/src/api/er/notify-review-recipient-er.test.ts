import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { ReviewCreatedEvent } from '#domain/review/events';
import { NotifyReviewRecipientEr } from './notify-review-recipient-er';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '24444444-4444-4444-8444-444444444444';
const MENTOR = '33333333-3333-4333-8333-333333333333';
const CAMPAIGN_ID = '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const REVIEW_ID = '4aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function createdEvent(
  direction: ReviewCreatedEvent['payload']['direction'],
  overrides?: Partial<ReviewCreatedEvent['payload']>,
): ReviewCreatedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'review.created',
    occurredAt: '2026-09-20T10:00',
    aggregateName: 'Review',
    aggregateId: REVIEW_ID,
    payload: {
      reviewId: REVIEW_ID,
      campaignId: CAMPAIGN_ID,
      scopeId: SCOPE,
      authorId: ALICE,
      recipientId: BOB,
      direction,
      ...overrides,
    },
  };
}

/** Пользователь-заглушка: телеграм есть, если не указано иное. */
function user(uuid: string, name: string, telegramId?: number): User {
  return { uuid, name, telegramId: telegramId ?? 100 } as unknown as User;
}

interface FacadeCalls {
  notified: Array<{ userId: string; text: string; kind?: string }>;
  warns: unknown[];
}

function makeResolve(users: User[]) {
  const calls: FacadeCalls = { notified: [], warns: [] };
  const logger = {
    ...console,
    warn: mock((...args: unknown[]) => calls.warns.push(args)),
  };
  const resolve = {
    userFacade: {
      getUserByUuid: mock((uuid: string) =>
        Promise.resolve(users.find((u) => u.uuid === uuid)),
      ),
      notify: mock((userId: string, text: string, kind?: string) => {
        calls.notified.push({ userId, text, kind });
        return Promise.resolve();
      }),
    },
    appResolver: { logger, mode: 'test' as const },
  };
  return {
    resolve: resolve as unknown as PeerReviewApiModuleResolver,
    calls,
  };
}

describe('NotifyReviewRecipientEr', () => {
  test('соученик написал: уведомление адресату с ролью автора', async () => {
    const { resolve, calls } = makeResolve([
      user(ALICE, 'Алиса'),
      user(BOB, 'Боб'),
    ]);
    const er = new NotifyReviewRecipientEr();
    er.init(resolve);

    await er.handle(createdEvent('student_student'));

    expect(calls.notified).toHaveLength(1);
    expect(calls.notified[0]).toMatchObject({
      userId: BOB,
      kind: 'notify',
    });
    expect(calls.notified[0]!.text).toContain('Алиса');
    expect(calls.notified[0]!.text).toContain('соученик');
    expect(calls.warns).toHaveLength(0);
  });

  test('студент написал ментору: роль «твой студент»', async () => {
    const { resolve, calls } = makeResolve([
      user(ALICE, 'Алиса'),
      user(MENTOR, 'Ментор'),
    ]);
    const er = new NotifyReviewRecipientEr();
    er.init(resolve);

    await er.handle(createdEvent('student_mentor', { recipientId: MENTOR }));

    expect(calls.notified[0]!.userId).toBe(MENTOR);
    expect(calls.notified[0]!.text).toContain('твой студент');
  });

  test('ментор написал студенту: роль «твой ментор»', async () => {
    const { resolve, calls } = makeResolve([
      user(MENTOR, 'Ментор'),
      user(ALICE, 'Алиса'),
    ]);
    const er = new NotifyReviewRecipientEr();
    er.init(resolve);

    await er.handle(
      createdEvent('mentor_student', { authorId: MENTOR, recipientId: ALICE }),
    );

    expect(calls.notified[0]!.userId).toBe(ALICE);
    expect(calls.notified[0]!.text).toContain('твой ментор');
  });

  test('у адресата нет telegramId — warn, уведомление не отправляется', async () => {
    const { resolve, calls } = makeResolve([
      user(ALICE, 'Алиса'),
      // telegramId обязателен по схеме User — защитная ветка ER против
      // мусорных данных (прецедент: invite-wishers-er)
      user(BOB, 'Боб', 0),
    ]);
    const er = new NotifyReviewRecipientEr();
    er.init(resolve);

    await er.handle(createdEvent('student_student'));

    expect(calls.notified).toHaveLength(0);
    expect(calls.warns).toHaveLength(1);
  });

  test('автор не найден — warn, уведомление не отправляется', async () => {
    const { resolve, calls } = makeResolve([user(BOB, 'Боб')]);
    const er = new NotifyReviewRecipientEr();
    er.init(resolve);

    await er.handle(createdEvent('student_student'));

    expect(calls.notified).toHaveLength(0);
    expect(calls.warns).toHaveLength(1);
  });
});
