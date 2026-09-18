import { describe, expect, mock, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { Review } from '#domain/review/entity';
import type { ReviewRepo } from '#domain/review/repo';
import { ListScopeFactsUc } from './list-scope-facts-uc';

const SCOPE = '11111111-1111-4111-8111-111111111111';

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

const review = (n: number): Review => ({
  uuid: `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, '0')}`,
  scopeId: SCOPE,
  campaignId: '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  authorId: '22222222-2222-4222-8222-222222222222',
  authorRole: 'student',
  authorOutcome: 'completed',
  recipientId: '33333333-3333-4333-8333-333333333333',
  recipientRole: 'mentor',
  text: 'Текст отзыва достаточной длины.',
  createdAt: '2026-09-20T11:00',
});

describe('ListScopeFactsUc (ФР-8)', () => {
  test('отзывов нет — hasReviews false, count 0', async () => {
    const uc = new ListScopeFactsUc();
    uc.init(makeResolve([]));

    const res = await uc.execute({ scopeId: SCOPE });
    expect(res).toEqual({ hasReviews: false, reviewsCount: 0 });
  });

  test('отзывы есть — hasReviews true, count N', async () => {
    const uc = new ListScopeFactsUc();
    uc.init(makeResolve([review(1), review(2)]));

    const res = await uc.execute({ scopeId: SCOPE });
    expect(res).toEqual({ hasReviews: true, reviewsCount: 2 });
  });
});
