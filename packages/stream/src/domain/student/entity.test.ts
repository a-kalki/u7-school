import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { StepRecordSchema, StudentSchema } from './entity';

describe('StudentSchema', () => {
  describe('валидация корректного студента', () => {
    test('полный валидный объект студента', () => {
      const result = v.safeParse(StudentSchema, {
        uuid: '11111111-1111-4111-8111-111111111111',
        streamId: '22222222-2222-4222-8222-222222222222',
        userId: '33333333-3333-4333-8333-333333333333',
        enrolledAt: '2026-06-01T10:00',
        status: 'active',
        currentStepId: '44444444-4444-4444-8444-444444444444',
        steps: [],
        createdAt: '2026-06-01T10:00',
      });
      expect(result.success).toBe(true);
    });

    test('со всеми опциональными полями', () => {
      const result = v.safeParse(StudentSchema, {
        uuid: '11111111-1111-4111-8111-111111111111',
        streamId: '22222222-2222-4222-8222-222222222222',
        userId: '33333333-3333-4333-8333-333333333333',
        enrolledAt: '2026-06-01T10:00',
        status: 'active',
        currentStepId: '44444444-4444-4444-8444-444444444444',
        steps: [],
        createdAt: '2026-06-01T10:00',
        updatedAt: '2026-06-01T11:00',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('отклоняет некорректные данные', () => {
    test('без обязательного uuid', () => {
      const result = v.safeParse(StudentSchema, {
        streamId: '22222222-2222-4222-8222-222222222222',
        userId: '33333333-3333-4333-8333-333333333333',
        enrolledAt: '2026-06-01T10:00',
      });
      expect(result.success).toBe(false);
    });

    test('некорректный UUID', () => {
      const result = v.safeParse(StudentSchema, {
        uuid: 'not-a-uuid',
        streamId: '22222222-2222-4222-8222-222222222222',
        userId: '33333333-3333-4333-8333-333333333333',
        enrolledAt: '2026-06-01T10:00',
        status: 'active',
        currentStepId: '44444444-4444-4444-8444-444444444444',
        steps: [],
        createdAt: '2026-06-01T10:00',
      });
      expect(result.success).toBe(false);
    });

    test('невалидный статус студента', () => {
      const result = v.safeParse(StudentSchema, {
        uuid: '11111111-1111-4111-8111-111111111111',
        streamId: '22222222-2222-4222-8222-222222222222',
        userId: '33333333-3333-4333-8333-333333333333',
        enrolledAt: '2026-06-01T10:00',
        status: 'unknown_status',
        currentStepId: '44444444-4444-4444-8444-444444444444',
        steps: [],
        createdAt: '2026-06-01T10:00',
      });
      expect(result.success).toBe(false);
    });

    test('некорректный формат даты', () => {
      const result = v.safeParse(StudentSchema, {
        uuid: '11111111-1111-4111-8111-111111111111',
        streamId: '22222222-2222-4222-8222-222222222222',
        userId: '33333333-3333-4333-8333-333333333333',
        enrolledAt: 'not-a-date',
        status: 'active',
        currentStepId: '44444444-4444-4444-8444-444444444444',
        steps: [],
        createdAt: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('StepRecordSchema', () => {
    test('валидный шаг со статусом issued', () => {
      const result = v.safeParse(StepRecordSchema, {
        stepId: '11111111-1111-4111-8111-111111111111',
        status: 'issued',
        issuedAt: '2026-06-01T10:00',
      });
      expect(result.success).toBe(true);
    });

    test('валидный шаг со статусом completed', () => {
      const result = v.safeParse(StepRecordSchema, {
        stepId: '11111111-1111-4111-8111-111111111111',
        status: 'completed',
        issuedAt: '2026-06-01T10:00',
        completedAt: '2026-06-01T11:00',
      });
      expect(result.success).toBe(true);
    });

    test('отклоняет невалидный статус шага', () => {
      const result = v.safeParse(StepRecordSchema, {
        stepId: '11111111-1111-4111-8111-111111111111',
        status: 'pending',
        issuedAt: '2026-06-01T10:00',
      });
      expect(result.success).toBe(false);
    });
  });
});
