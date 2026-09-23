import { describe, expect, mock, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { Review } from '#domain/review/entity';
import type { ReviewRepo } from '#domain/review/repo';
import { ListMyReviewsUc } from './list-my-reviews-uc';

const ME = '22222222-2222-4222-8222-222222222222';
const ALICE = '33333333-3333-4333-8333-333333333333';
const BOB = '34444444-4444-4444-8444-444444444444';

function review(
  uuid: string,
  overrides: Partial<Review> & { recipientId: string; authorId: string },
): Review {
  return {
    uuid,
    scopeId: '11111111-1111-4111-8111-111111111111',
    campaignId: '5aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    direction: 'student_student',
    authorOutcome: 'completed_passed',
    text: 'Текст отзыва достаточной длины.',
    createdAt: '2026-09-20T11:00',
    ...overrides,
  };
}

function makeResolve(reviews: Review[]) {
  const resolve = {
    reviewRepo: {
      findByRecipient: mock(() => Promise.resolve(reviews)),
    } as unknown as ReviewRepo,
    streamFacade: {},
    appResolver: {
      logger: console,
      mode: 'test' as const,
      eventBus: new InProcEventBus(),
    },
    eventBus: new InProcEventBus(),
  };
  return resolve as unknown as PeerReviewApiModuleResolver;
}

describe('ListMyReviewsUc (S08)', () => {
  test('отзывов нет — пустой список', async () => {
    const uc = new ListMyReviewsUc();
    uc.init(makeResolve([]));

    const res = await uc.execute({ userId: ME });
    expect(res).toEqual({ reviews: [] });
  });

  test('только отзывы адресату: читает репо по userId', async () => {
    const reviews = [
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', {
        authorId: ALICE,
        recipientId: ME,
      }),
    ];
    const resolve = makeResolve(reviews);
    const uc = new ListMyReviewsUc();
    uc.init(resolve);

    const res = await uc.execute({ userId: ME });
    expect(resolve.reviewRepo.findByRecipient).toHaveBeenCalledWith(ME);
    expect(res.reviews).toHaveLength(1);
    expect(res.reviews[0]).toMatchObject({
      reviewId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
      authorId: ALICE,
    });
  });

  test('новые наверху: сортировка по createdAt desc', async () => {
    const reviews = [
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', {
        authorId: ALICE,
        recipientId: ME,
        createdAt: '2026-09-18T10:00',
      }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000003', {
        authorId: BOB,
        recipientId: ME,
        createdAt: '2026-09-20T12:00',
      }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000002', {
        authorId: ALICE,
        recipientId: ME,
        createdAt: '2026-09-19T09:00',
      }),
    ];
    const uc = new ListMyReviewsUc();
    uc.init(makeResolve(reviews));

    const res = await uc.execute({ userId: ME });
    expect(res.reviews.map((r) => r.reviewId)).toEqual([
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000003',
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    ]);
  });

  test('равные createdAt — стабильный порядок по uuid desc', async () => {
    const reviews = [
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', {
        authorId: ALICE,
        recipientId: ME,
        createdAt: '2026-09-20T10:00',
      }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000009', {
        authorId: BOB,
        recipientId: ME,
        createdAt: '2026-09-20T10:00',
      }),
    ];
    const uc = new ListMyReviewsUc();
    uc.init(makeResolve(reviews));

    const res = await uc.execute({ userId: ME });
    expect(res.reviews.map((r) => r.reviewId)).toEqual([
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000009',
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    ]);
  });

  test('исход автора-ментора не подмешивается; исход студента сохраняется', async () => {
    const reviews = [
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', {
        authorId: ALICE,
        recipientId: ME,
        direction: 'mentor_student',
        authorOutcome: undefined,
        createdAt: '2026-09-20T10:00',
      }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000002', {
        authorId: BOB,
        recipientId: ME,
        direction: 'student_student',
        authorOutcome: 'dropped',
        createdAt: '2026-09-20T11:00',
      }),
    ];
    const uc = new ListMyReviewsUc();
    uc.init(makeResolve(reviews));

    const res = await uc.execute({ userId: ME });
    expect(res.reviews[0]?.authorOutcome).toBe('dropped');
    expect(res.reviews[1]).not.toHaveProperty('authorOutcome');
  });
});
