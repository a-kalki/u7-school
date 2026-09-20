import { describe, expect, test } from 'bun:test';
import type { Review } from '../review/entity';
import { ReviewCampaignAr } from './a-root';
import { CampaignFactsDs } from './campaign-facts-ds';
import type { ReviewCampaign } from './entity';

const T0 = new Date('2026-09-20T10:00');
const SCOPE = '22222222-2222-4222-8222-222222222222';
const SUBJECT = '77777777-7777-4777-8777-777777777777';
const BOB = '44444444-4444-4444-8444-444444444444';
const MENTOR = '55555555-5555-4555-8555-555555555555';

function ar(): ReviewCampaignAr {
  const state: ReviewCampaign = {
    uuid: '11111111-1111-4111-8111-111111111111',
    context: 'stream_fate',
    scopeId: SCOPE,
    subjectId: SUBJECT,
    createdAt: '2026-09-20T10:00',
    expiresAt: '2026-09-27T10:00',
    participants: [BOB],
    payload: { subjectOutcome: 'completed_passed', mentorId: MENTOR },
  };
  return new ReviewCampaignAr(state);
}

function review(uuid: number, recipientId: string): Review {
  return {
    uuid: `aaaaaaaa-aaaa-4aaa-8aaa-${String(uuid).padStart(12, '0')}`,
    scopeId: SCOPE,
    campaignId: '11111111-1111-4111-8111-111111111111',
    authorId: SUBJECT,
    direction: 'student_mentor',
    authorOutcome: 'completed_passed',
    recipientId,
    text: 'Текст отзыва достаточной длины.',
    createdAt: '2026-09-20T11:00',
  };
}

describe('CampaignFactsDs (два агрегата: кампания + отзывы)', () => {
  test('myCampaignFacts: роль из AR, M — только мои отзывы, K — адресаты политики', () => {
    const campaign = ar();
    const reviews = [
      review(1, MENTOR),
      { ...review(2, SUBJECT), authorId: BOB }, // чужой отзыв — в M не считается
      {
        ...review(3, BOB),
        authorId: BOB,
        direction: 'student_student' as const,
      },
    ];
    const facts = CampaignFactsDs.myCampaignFacts(
      campaign,
      SUBJECT,
      reviews,
      T0,
    );
    expect(facts).toEqual({
      myRole: 'subject',
      daysLeft: 7,
      progress: { done: 1, total: 2 },
    });
  });

  test('recipientsWithMyReview: ✅ только там, где мой отзыв есть', () => {
    const campaign = ar();
    const myReviews = [review(1, MENTOR)];
    const res = CampaignFactsDs.recipientsWithMyReview(
      campaign,
      SUBJECT,
      myReviews,
    );
    expect(res).toEqual([
      { userId: BOB, hasMyReview: false },
      { userId: MENTOR, hasMyReview: true },
    ]);
  });
});
