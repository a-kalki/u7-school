import { describe, expect, mock, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { Review } from '#domain/review/entity';
import type { ReviewRepo } from '#domain/review/repo';
import { GetMyReviewUc } from './get-my-review-uc';

const CAMPAIGN_ID = '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ALICE = '22222222-2222-4222-8222-222222222222';
const MENTOR = '33333333-3333-4333-8333-333333333333';
const TEXT = 'Крепкий напарник по паре, всё получалось.';

function makeReview() {
  return {
    uuid: '10000000-0000-4000-8000-000000000001',
    campaignId: CAMPAIGN_ID,
    scopeId: '11111111-1111-4111-8111-111111111111',
    authorId: ALICE,
    authorRole: 'student',
    recipientId: MENTOR,
    recipientRole: 'mentor',
    text: TEXT,
    createdAt: '2026-09-20T10:00',
  } as unknown as Review;
}

function makeResolve(existing?: Review) {
  const resolve = {
    reviewRepo: {
      findByPair: mock(() => Promise.resolve(existing)),
    } as unknown as ReviewRepo,
    appResolver: {
      logger: console,
      mode: 'test' as const,
      eventBus: new InProcEventBus(),
    },
    eventBus: new InProcEventBus(),
  };
  return resolve as unknown as PeerReviewApiModuleResolver;
}

describe('GetMyReviewUc (S04 — текст моего отзыва)', () => {
  test('отзыв есть — found: true и текст', async () => {
    const resolve = makeResolve(makeReview());
    const uc = new GetMyReviewUc();
    uc.init(resolve);

    const res = await uc.execute({
      campaignId: CAMPAIGN_ID,
      authorId: ALICE,
      recipientId: MENTOR,
    });

    expect(res).toEqual({ found: true, text: TEXT });
  });

  test('отзыва нет — found: false', async () => {
    const resolve = makeResolve(undefined);
    const uc = new GetMyReviewUc();
    uc.init(resolve);

    const res = await uc.execute({
      campaignId: CAMPAIGN_ID,
      authorId: ALICE,
      recipientId: MENTOR,
    });

    expect(res).toEqual({ found: false });
  });
});
