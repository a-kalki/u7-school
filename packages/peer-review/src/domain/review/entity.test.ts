import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
  REVIEW_TEXT_MAX_LENGTH,
  REVIEW_TEXT_MIN_LENGTH,
  ReviewDirectionSchema,
  ReviewSchema,
} from './entity';

const UUIDS = {
  review: '11111111-1111-4111-8111-111111111111',
  scope: '12222222-2222-4222-8222-222222222222',
  campaign: '22222222-2222-4222-8222-222222222222',
  author: '33333333-3333-4333-8333-333333333333',
  recipient: '44444444-4444-4444-8444-444444444444',
};

function review(overrides: Record<string, unknown> = {}) {
  return {
    uuid: UUIDS.review,
    scopeId: UUIDS.scope,
    campaignId: UUIDS.campaign,
    authorId: UUIDS.author,
    direction: 'student_student',
    authorOutcome: 'completed_passed',
    recipientId: UUIDS.recipient,
    text: 'Ровный текст отзыва достаточной длины.',
    createdAt: '2026-09-20T12:00',
    ...overrides,
  };
}

describe('ReviewDirectionSchema', () => {
  test('принимает три направления «кто о ком»', () => {
    expect(v.safeParse(ReviewDirectionSchema, 'student_student').success).toBe(
      true,
    );
    expect(v.safeParse(ReviewDirectionSchema, 'student_mentor').success).toBe(
      true,
    );
    expect(v.safeParse(ReviewDirectionSchema, 'mentor_student').success).toBe(
      true,
    );
  });

  test('невозможная пара mentor_mentor исключена типом', () => {
    expect(v.safeParse(ReviewDirectionSchema, 'mentor_mentor').success).toBe(
      false,
    );
  });
});

describe('ReviewSchema', () => {
  test('валидный отзыв студента', () => {
    const result = v.safeParse(ReviewSchema, review());
    expect(result.success).toBe(true);
  });

  test('валидный отзыв ментора (authorOutcome отсутствует)', () => {
    const result = v.safeParse(
      ReviewSchema,
      review({ direction: 'mentor_student', authorOutcome: undefined }),
    );
    expect(result.success).toBe(true);
  });

  test('снапшоты кампании обязательны: campaignId, direction', () => {
    expect(v.safeParse(ReviewSchema, review({ campaignId: 'x' })).success).toBe(
      false,
    );
    expect(
      v.safeParse(ReviewSchema, review({ direction: 'student_teacher' }))
        .success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewSchema, { ...review(), direction: undefined }).success,
    ).toBe(false);
  });

  test('authorOutcome — только 4-значные проекции', () => {
    expect(
      v.safeParse(ReviewSchema, review({ authorOutcome: 'advanced' })).success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewSchema, review({ authorOutcome: 'in_progress' }))
        .success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewSchema, review({ authorOutcome: 'completed' })).success,
    ).toBe(false);
  });

  describe('валидация длины текста', () => {
    test(`минимум ${REVIEW_TEXT_MIN_LENGTH} символов`, () => {
      expect(REVIEW_TEXT_MIN_LENGTH).toBe(10);
      const short = 'а'.repeat(REVIEW_TEXT_MIN_LENGTH - 1);
      expect(v.safeParse(ReviewSchema, review({ text: short })).success).toBe(
        false,
      );
    });

    test(`ровно ${REVIEW_TEXT_MIN_LENGTH} символов — валиден`, () => {
      const edge = 'а'.repeat(REVIEW_TEXT_MIN_LENGTH);
      expect(v.safeParse(ReviewSchema, review({ text: edge })).success).toBe(
        true,
      );
    });

    test(`ровно ${REVIEW_TEXT_MAX_LENGTH} символов — валиден`, () => {
      const edge = 'а'.repeat(REVIEW_TEXT_MAX_LENGTH);
      expect(v.safeParse(ReviewSchema, review({ text: edge })).success).toBe(
        true,
      );
    });

    test(`максимум ${REVIEW_TEXT_MAX_LENGTH} символов`, () => {
      expect(REVIEW_TEXT_MAX_LENGTH).toBe(3500);
      const long = 'а'.repeat(REVIEW_TEXT_MAX_LENGTH + 1);
      expect(v.safeParse(ReviewSchema, review({ text: long })).success).toBe(
        false,
      );
    });
  });
});
