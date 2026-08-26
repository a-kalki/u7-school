import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import type { WishTarget } from './entity';
import { WishSchema, WishStatusSchema, WishTargetSchema } from './entity';

const validCourseTarget: WishTarget = {
  kind: 'course',
  courseId: crypto.randomUUID(),
};

describe('WishTargetSchema', () => {
  test('принимает валидную цель course', () => {
    const result = v.safeParse(WishTargetSchema, validCourseTarget);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual(validCourseTarget);
    }
  });

  test('отклоняет неизвестный kind цели', () => {
    const result = v.safeParse(WishTargetSchema, {
      kind: 'mentorship',
      mentorId: 'x',
    });

    expect(result.success).toBe(false);
  });

  test('отклоняет цель course без courseId', () => {
    const result = v.safeParse(WishTargetSchema, { kind: 'course' });

    expect(result.success).toBe(false);
  });

  test('отклоняет цель с невалидным форматом courseId', () => {
    const result = v.safeParse(WishTargetSchema, {
      kind: 'course',
      courseId: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
  });
});

describe('WishStatusSchema', () => {
  test.each([
    'expressed',
    'pending',
    'confirmed',
    'cancelled',
    'abandoned',
    'fulfilled',
  ])('принимает статус %s', (status) => {
    expect(v.safeParse(WishStatusSchema, status).success).toBe(true);
  });

  test('отклоняет неизвестный статус', () => {
    expect(v.safeParse(WishStatusSchema, 'unknown').success).toBe(false);
  });
});

describe('WishSchema', () => {
  test('принимает желание с target вместо courseId', () => {
    const wish = {
      uuid: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      target: validCourseTarget,
      status: 'pending',
      createdAt: '2026-08-26T10:00',
    };

    const result = v.safeParse(WishSchema, wish);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.target).toEqual(validCourseTarget);
    }
  });

  test('отклоняет желание с legacy-полем courseId вместо target', () => {
    const legacyWish = {
      uuid: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      courseId: crypto.randomUUID(),
      status: 'expressed',
      createdAt: '2026-08-26T10:00',
    };

    expect(v.safeParse(WishSchema, legacyWish).success).toBe(false);
  });
});
