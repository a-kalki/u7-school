import { describe, expect, test } from 'bun:test';
import type { Review } from './entity';
import { ScopeReviewsDs } from './scope-reviews-ds';

const SCOPE = '22222222-2222-4222-8222-222222222222';
const ALICE = '33333333-3333-4333-8333-333333333333';
const BOB = '44444444-4444-4444-8444-444444444444';
const MENTOR = '55555555-5555-4555-8555-555555555555';

function review(uuid: string, overrides: Partial<Review>): Review {
  return {
    uuid,
    scopeId: SCOPE,
    campaignId: '11111111-1111-4111-8111-111111111111',
    authorId: ALICE,
    direction: 'student_mentor',
    authorOutcome: 'completed_passed',
    recipientId: MENTOR,
    text: 'Текст отзыва достаточной длины.',
    createdAt: '2026-09-20T11:00',
    ...overrides,
  };
}

describe('ScopeReviewsDs: группировка отзывов скоупа', () => {
  test('группы по адресатам в порядке первого появления, отзывы по createdAt', () => {
    const reviews = [
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', { recipientId: MENTOR }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000002', {
        recipientId: BOB,
        direction: 'student_student',
        createdAt: '2026-09-20T12:00',
      }),
      review('aaaaaaaa-aaaa-4aaa-8aaa-000000000003', {
        recipientId: BOB,
        direction: 'mentor_student',
        authorId: MENTOR,
        authorOutcome: undefined,
        createdAt: '2026-09-20T10:00',
      }),
    ];

    const groups = ScopeReviewsDs.groupByRecipient(reviews);

    // группы — по первому появлению ПОСЛЕ сортировки по createdAt:
    // самый ранний отзыв (10:00) — про BOB
    expect(groups.map((g) => g.recipientId)).toEqual([BOB, MENTOR]);
    const bobGroup = groups[0]!;
    expect(bobGroup.reviews.map((r) => r.createdAt)).toEqual([
      '2026-09-20T10:00',
      '2026-09-20T12:00',
    ]);
    // снапшоты автора переносятся, uuid переименован в reviewId
    expect(bobGroup.reviews[0]).toEqual({
      reviewId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000003',
      authorId: MENTOR,
      direction: 'mentor_student',
      text: 'Текст отзыва достаточной длины.',
      createdAt: '2026-09-20T10:00',
    });
  });

  test('пустой скоуп — пустой список групп', () => {
    expect(ScopeReviewsDs.groupByRecipient([])).toEqual([]);
  });
});
