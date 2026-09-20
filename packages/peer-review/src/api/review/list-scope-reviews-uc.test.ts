import { describe, expect, mock, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { Review } from '#domain/review/entity';
import type { ReviewRepo } from '#domain/review/repo';
import { ListScopeReviewsUc } from './list-scope-reviews-uc';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const ALICE = '22222222-2222-4222-8222-222222222222';
const BOB = '24444444-4444-4444-8444-444444444444';
const MENTOR = '33333333-3333-4333-8333-333333333333';

function review(
  uuid: string,
  overrides: Partial<Review> & { recipientId: string; authorId: string },
): Review {
  return {
    uuid,
    scopeId: SCOPE,
    campaignId: '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
      findByScope: mock(() => Promise.resolve(reviews)),
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

describe('ListScopeReviewsUc (ФР-7)', () => {
  test('пустой скоуп — пустой список групп', async () => {
    const uc = new ListScopeReviewsUc();
    uc.init(makeResolve([]));

    const res = await uc.execute({ scopeId: SCOPE });
    expect(res).toEqual({ scopeId: SCOPE, recipients: [] });
  });

  test('группировка по адресатам со снапшотами ролей/исходов', async () => {
    const reviews = [
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', {
        authorId: ALICE,
        direction: 'student_mentor',
        recipientId: MENTOR,
      }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000002', {
        authorId: MENTOR,
        direction: 'mentor_student',
        authorOutcome: undefined,
        recipientId: ALICE,
      }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000003', {
        authorId: BOB,
        authorOutcome: 'dropped',
        recipientId: ALICE,
      }),
    ];
    const uc = new ListScopeReviewsUc();
    uc.init(makeResolve(reviews));

    const res = await uc.execute({ scopeId: SCOPE });
    expect(res.recipients).toHaveLength(2);

    const byRecipient = new Map(res.recipients.map((g) => [g.recipientId, g]));
    const aboutAlice = byRecipient.get(ALICE)!;
    expect(aboutAlice.reviews).toHaveLength(2);
    expect(aboutAlice.reviews[0]).toMatchObject({
      reviewId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
      authorId: MENTOR,
      direction: 'mentor_student',
    });
    expect(aboutAlice.reviews[0]).not.toHaveProperty('authorOutcome');

    const aboutMentor = byRecipient.get(MENTOR)!;
    expect(aboutMentor.reviews[0]).toMatchObject({
      authorId: ALICE,
      direction: 'student_mentor',
      authorOutcome: 'completed_passed',
    });
  });

  test('отзывы внутри группы упорядочены по createdAt', async () => {
    const reviews = [
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000002', {
        authorId: BOB,
        recipientId: ALICE,
        createdAt: '2026-09-20T12:00',
      }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', {
        authorId: MENTOR,
        direction: 'mentor_student',
        authorOutcome: undefined,
        recipientId: ALICE,
        createdAt: '2026-09-20T10:00',
      }),
    ];
    const uc = new ListScopeReviewsUc();
    uc.init(makeResolve(reviews));

    const res = await uc.execute({ scopeId: SCOPE });
    const texts = res.recipients[0]!.reviews.map((r) => r.createdAt);
    expect(texts).toEqual(['2026-09-20T10:00', '2026-09-20T12:00']);
  });
});
