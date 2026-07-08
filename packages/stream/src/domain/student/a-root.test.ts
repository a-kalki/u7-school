import { describe, expect, test } from 'bun:test';
import { StudentAr } from './a-root';

const mockStreamId = '11111111-1111-4111-8111-111111111111';
const mockUserId = '22222222-2222-4222-8222-222222222222';
const mockStepId = '33333333-3333-4333-8333-333333333333';

describe('StudentAr', () => {
  describe('enroll', () => {
    test('создаёт студента со статусом enrolled и пустыми шагами', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);

      expect(ar.state.streamId).toBe(mockStreamId);
      expect(ar.state.userId).toBe(mockUserId);
      expect(ar.state.currentStepId).toBe(mockStepId);
      expect(ar.state.status).toBe('enrolled');
      expect(ar.state.steps).toEqual([]);
      expect(ar.state.uuid).toMatch(
        /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      );
      expect(ar.state.enrolledAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(ar.state.updatedAt).toBeUndefined();
      expect(ar.state.abandonDetails).toBeUndefined();
      expect(ar.state.completionDetails).toBeUndefined();
    });

    test('currentStepId должен быть передан при создании', () => {
      expect(() => StudentAr.enroll(mockStreamId, mockUserId, '')).toThrow();
    });
  });

  describe('activate', () => {
    test('переводит enrolled → active', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      expect(ar.state.status).toBe('enrolled');

      ar.activate();
      expect(ar.state.status).toBe('active');
    });

    test('активация не-enrolled → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate(); // теперь active
      expect(ar.state.status).toBe('active');

      expect(() => ar.activate()).toThrow(
        "Нельзя активировать студента в статусе 'active'.",
      );
    });

    test('активация abandoned → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.drop();
      expect(ar.state.status).toBe('abandoned');

      expect(() => ar.activate()).toThrow();
    });
  });

  describe('drop', () => {
    test('переводит active → abandoned (who=self, cause=voluntary)', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      expect(ar.state.status).toBe('active');

      ar.drop();
      expect(ar.state.status).toBe('abandoned');
      expect(ar.state.abandonDetails).toEqual({
        who: 'self',
        cause: 'voluntary',
      });
    });

    test('drop не из active → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      // enrolled — нельзя дропнуть
      expect(() => ar.drop()).toThrow(
        "Нельзя отчислить студента в статусе 'enrolled'.",
      );
    });

    test('drop на advanced → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.advance();
      expect(ar.state.status).toBe('advanced');

      expect(() => ar.drop()).toThrow();
    });
  });

  describe('markAbandoned', () => {
    test('переводит active → abandoned (who=mentor, cause=inactivity)', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();

      ar.markAbandoned('inactivity');
      expect(ar.state.status).toBe('abandoned');
      expect(ar.state.abandonDetails).toEqual({
        who: 'mentor',
        cause: 'inactivity',
      });
    });

    test('переводит active → abandoned (who=mentor, cause=by_mentor)', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();

      ar.markAbandoned('by_mentor');
      expect(ar.state.status).toBe('abandoned');
      expect(ar.state.abandonDetails).toEqual({
        who: 'mentor',
        cause: 'by_mentor',
      });
    });

    test('markAbandoned не из active → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      expect(() => ar.markAbandoned('inactivity')).toThrow();
    });
  });

  describe('advance', () => {
    test('переводит active → advanced c nextPreference=undecided', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();

      ar.advance();
      expect(ar.state.status).toBe('advanced');
      expect(ar.state.completionDetails).toEqual({
        nextPreference: 'undecided',
      });
    });

    test('advance не из active → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      expect(() => ar.advance()).toThrow();
    });
  });

  describe('markNotAdvanced', () => {
    test('переводит active → not_advanced c nextPreference=undecided', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();

      ar.markNotAdvanced();
      expect(ar.state.status).toBe('not_advanced');
      expect(ar.state.completionDetails).toEqual({
        nextPreference: 'undecided',
      });
    });

    test('markNotAdvanced не из active → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      expect(() => ar.markNotAdvanced()).toThrow();
    });
  });

  describe('setNextPreference', () => {
    test('обновляет nextPreference у advanced студента', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.advance();

      ar.setNextPreference('wants_next');
      expect(ar.state.completionDetails?.nextPreference).toBe('wants_next');
    });

    test('обновляет nextPreference у not_advanced студента', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.markNotAdvanced();

      ar.setNextPreference('wants_repeat');
      expect(ar.state.completionDetails?.nextPreference).toBe('wants_repeat');
    });

    test('setNextPreference на active → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();

      expect(() => ar.setNextPreference('wants_next')).toThrow(
        "Нельзя установить предпочтение для студента в статусе 'active'.",
      );
    });

    test('setNextPreference на enrolled → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      expect(() => ar.setNextPreference('wants_next')).toThrow();
    });

    test('setNextPreference на abandoned → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.drop();

      expect(() => ar.setNextPreference('wants_next')).toThrow();
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

  describe('недопустимые переходы', () => {
    test('abandoned → advanced — ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.drop();
      expect(ar.state.status).toBe('abandoned');

      expect(() => ar.advance()).toThrow();
    });

    test('not_advanced → active — ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.markNotAdvanced();
      expect(ar.state.status).toBe('not_advanced');

      expect(() => ar.activate()).toThrow();
    });

    test('advanced → active — ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.advance();
      expect(ar.state.status).toBe('advanced');

      expect(() => ar.activate()).toThrow();
    });
  });
});
