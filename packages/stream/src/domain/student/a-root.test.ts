import { describe, expect, test } from 'bun:test';
import { StudentAr } from './a-root';

const mockStreamId = '11111111-1111-4111-8111-111111111111';
const mockUserId = '22222222-2222-4222-8222-222222222222';
const mockStepId = '33333333-3333-4333-8333-333333333333';

describe('StudentAr', () => {
  describe('enroll', () => {
    test('создаёт студента с корректными полями, статусом active и пустыми шагами', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);

      expect(ar.state.streamId).toBe(mockStreamId);
      expect(ar.state.userId).toBe(mockUserId);
      expect(ar.state.currentStepId).toBe(mockStepId);
      expect(ar.state.status).toBe('active');
      expect(ar.state.steps).toEqual([]);
      expect(ar.state.uuid).toMatch(
        /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      );
      expect(ar.state.enrolledAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(ar.state.updatedAt).toBeUndefined();
    });

    test('currentStepId должен быть передан при создании', () => {
      expect(() => StudentAr.enroll(mockStreamId, mockUserId, '')).toThrow();
    });
  });

  describe('issueStep', () => {
    test('добавляет StepRecord со статусом issued и обновляет currentStepId', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      const nextStepId = '44444444-4444-4444-8444-444444444444';

      ar.issueStep(nextStepId);

      expect(ar.state.currentStepId).toBe(nextStepId);
      expect(ar.state.steps).toHaveLength(1);
      expect(ar.state.steps[0]?.stepId).toBe(nextStepId);
      expect(ar.state.steps[0]?.status).toBe('issued');
      expect(ar.state.steps[0]?.issuedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      );
      expect(ar.state.steps[0]?.completedAt).toBeUndefined();
    });

    test('выбрасывает ошибку если stepId уже выдан', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      const nextStepId = '44444444-4444-4444-8444-444444444444';

      ar.issueStep(nextStepId);

      expect(() => ar.issueStep(nextStepId)).toThrow();
    });
  });

  describe('completeStep', () => {
    test('меняет статус StepRecord на completed и проставляет completedAt', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      const nextStepId = '44444444-4444-4444-8444-444444444444';

      ar.issueStep(nextStepId);
      ar.completeStep(nextStepId);

      expect(ar.state.steps).toHaveLength(1);
      expect(ar.state.steps[0]?.stepId).toBe(nextStepId);
      expect(ar.state.steps[0]?.status).toBe('completed');
      expect(ar.state.steps[0]?.completedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      );
    });

    test('выбрасывает ошибку если шаг не был выдан', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      const nextStepId = '44444444-4444-4444-8444-444444444444';

      expect(() => ar.completeStep(nextStepId)).toThrow();
    });
  });

  describe('complete', () => {
    test('меняет статус студента на completed', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      expect(ar.state.status).toBe('active');

      ar.complete();
      expect(ar.state.status).toBe('completed');
    });
  });

  describe('expel', () => {
    test('expel() переводит active → expelled', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      expect(ar.state.status).toBe('active');

      ar.expel();
      expect(ar.state.status).toBe('expelled');
    });

    test('expel() на completed — исключение', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.complete();
      expect(ar.state.status).toBe('completed');

      expect(() => ar.expel()).toThrow();
    });

    test('expel() на expelled — исключение', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.expel();
      expect(ar.state.status).toBe('expelled');

      expect(() => ar.expel()).toThrow();
    });
  });
});
