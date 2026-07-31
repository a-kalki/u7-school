import { describe, expect, test } from 'bun:test';
import { StudentAr } from './a-root';
import type { Student } from './entity';

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
      expect(ar.status).toBe('enrolled');
      expect(ar.state.steps).toEqual([]);
      expect(ar.state.uuid).toMatch(
        /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      );
      expect(ar.state.enrolledAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(ar.state.updatedAt).toBeUndefined();
      expect(ar.abandonDetails).toBeUndefined();
      expect(ar.completionDetails).toBeUndefined();
    });

    test('currentStepId должен быть передан при создании', () => {
      expect(() => StudentAr.enroll(mockStreamId, mockUserId, '')).toThrow();
    });
  });

  describe('activate', () => {
    test('переводит enrolled → active', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      expect(ar.status).toBe('enrolled');

      ar.activate();
      expect(ar.status).toBe('active');
    });

    test('активация не-enrolled → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate(); // теперь active
      expect(ar.status).toBe('active');

      expect(() => ar.activate()).toThrow(
        "Нельзя активировать студента в статусе 'active'.",
      );
    });

    test('активация abandoned → ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.drop();
      expect(ar.status).toBe('abandoned');

      expect(() => ar.activate()).toThrow();
    });
  });

  describe('drop', () => {
    test('переводит active → abandoned (who=self, cause=voluntary)', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      expect(ar.status).toBe('active');

      ar.drop();
      expect(ar.status).toBe('abandoned');
      expect(ar.abandonDetails).toEqual({
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
      expect(ar.status).toBe('advanced');

      expect(() => ar.drop()).toThrow();
    });
  });

  describe('markAbandoned', () => {
    test('переводит active → abandoned (who=mentor, cause=inactivity)', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();

      ar.markAbandoned('inactivity');
      expect(ar.status).toBe('abandoned');
      expect(ar.abandonDetails).toEqual({
        who: 'mentor',
        cause: 'inactivity',
      });
    });

    test('переводит active → abandoned (who=mentor, cause=by_mentor)', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();

      ar.markAbandoned('by_mentor');
      expect(ar.status).toBe('abandoned');
      expect(ar.abandonDetails).toEqual({
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
      expect(ar.status).toBe('advanced');
      expect(ar.completionDetails).toEqual({
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
      expect(ar.status).toBe('not_advanced');
      expect(ar.completionDetails).toEqual({
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
      expect(ar.completionDetails?.nextPreference).toBe('wants_next');
    });

    test('обновляет nextPreference у not_advanced студента', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.markNotAdvanced();

      ar.setNextPreference('wants_repeat');
      expect(ar.completionDetails?.nextPreference).toBe('wants_repeat');
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
      expect(ar.status).toBe('abandoned');

      expect(() => ar.advance()).toThrow();
    });

    test('not_advanced → active — ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.markNotAdvanced();
      expect(ar.status).toBe('not_advanced');

      expect(() => ar.activate()).toThrow();
    });

    test('advanced → active — ошибка', () => {
      const ar = StudentAr.enroll(mockStreamId, mockUserId, mockStepId);
      ar.activate();
      ar.advance();
      expect(ar.status).toBe('advanced');

      expect(() => ar.activate()).toThrow();
    });
  });

  // ── computeLagLevel ──

  describe('computeLagLevel', () => {
    const now = new Date('2026-08-01T12:00');

    function makeStudent(
      steps: Array<{
        stepId: string;
        status: string;
        issuedAt: string;
        completedAt?: string;
      }>,
      status: Student['status'] = 'active',
    ) {
      return new StudentAr({
        uuid: crypto.randomUUID(),
        streamId: mockStreamId,
        userId: mockUserId,
        enrolledAt: '2026-07-01T00:00',
        status,
        currentStepId: mockStepId,
        steps: steps as Array<import('./entity').StepRecord>,
        createdAt: '2026-07-01T00:00',
      });
    }

    test('студент без шагов — on_track', () => {
      const ar = makeStudent([]);
      expect(ar.computeLagLevel(now)).toBe('on_track');
    });

    test('последний completedAt 3 дня назад — on_track', () => {
      const ar = makeStudent([
        {
          stepId: mockStepId,
          status: 'completed',
          issuedAt: '2026-07-28T12:00',
          completedAt: '2026-07-29T12:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('on_track');
    });

    test('ровно 4 дня назад — on_track (граница не включена)', () => {
      const ar = makeStudent([
        {
          stepId: mockStepId,
          status: 'completed',
          issuedAt: '2026-07-27T12:00',
          completedAt: '2026-07-28T12:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('on_track');
    });

    test('4 дня + 1 час — lagging', () => {
      const ar = makeStudent([
        {
          stepId: mockStepId,
          status: 'completed',
          issuedAt: '2026-07-27T11:00',
          completedAt: '2026-07-28T11:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('lagging');
    });

    test('6 дней назад — lagging', () => {
      const ar = makeStudent([
        {
          stepId: mockStepId,
          status: 'completed',
          issuedAt: '2026-07-25T12:00',
          completedAt: '2026-07-26T12:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('lagging');
    });

    test('ровно 7 дней назад — lagging (граница не включена)', () => {
      const ar = makeStudent([
        {
          stepId: mockStepId,
          status: 'completed',
          issuedAt: '2026-07-24T12:00',
          completedAt: '2026-07-25T12:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('lagging');
    });

    test('7 дней + 1 час — critical', () => {
      const ar = makeStudent([
        {
          stepId: mockStepId,
          status: 'completed',
          issuedAt: '2026-07-24T11:00',
          completedAt: '2026-07-25T11:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('critical');
    });

    test('10 дней назад — critical', () => {
      const ar = makeStudent([
        {
          stepId: mockStepId,
          status: 'completed',
          issuedAt: '2026-07-21T12:00',
          completedAt: '2026-07-22T12:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('critical');
    });

    test('шаг issued (без completed) — отставание от issuedAt', () => {
      const ar = makeStudent([
        {
          stepId: mockStepId,
          status: 'issued',
          issuedAt: '2026-07-25T11:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('critical');
    });

    test('abandoned студент — on_track', () => {
      const ar = makeStudent(
        [
          {
            stepId: mockStepId,
            status: 'completed',
            issuedAt: '2026-06-01T00:00',
            completedAt: '2026-06-02T00:00',
          },
        ],
        'abandoned',
      );
      expect(ar.computeLagLevel(now)).toBe('on_track');
    });

    test('advanced студент — on_track', () => {
      const ar = makeStudent(
        [
          {
            stepId: mockStepId,
            status: 'completed',
            issuedAt: '2026-06-01T00:00',
            completedAt: '2026-06-02T00:00',
          },
        ],
        'advanced',
      );
      expect(ar.computeLagLevel(now)).toBe('on_track');
    });

    test('not_advanced студент — on_track', () => {
      const ar = makeStudent(
        [
          {
            stepId: mockStepId,
            status: 'completed',
            issuedAt: '2026-06-01T00:00',
            completedAt: '2026-06-02T00:00',
          },
        ],
        'not_advanced',
      );
      expect(ar.computeLagLevel(now)).toBe('on_track');
    });

    test('несколько steps — учитывается самый поздний completedAt', () => {
      const ar = makeStudent([
        {
          stepId: '11111111-1111-4111-8111-111111111111',
          status: 'completed',
          issuedAt: '2026-07-01T00:00',
          completedAt: '2026-07-20T12:00',
        },
        {
          stepId: '22222222-2222-4222-8222-222222222222',
          status: 'completed',
          issuedAt: '2026-07-21T00:00',
          completedAt: '2026-07-26T12:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('lagging');
    });

    test('смесь completed и issued — учитывается самый поздний timestamp', () => {
      const ar = makeStudent([
        {
          stepId: '11111111-1111-4111-8111-111111111111',
          status: 'completed',
          issuedAt: '2026-07-01T00:00',
          completedAt: '2026-07-20T12:00',
        },
        {
          stepId: '22222222-2222-4222-8222-222222222222',
          status: 'issued',
          issuedAt: '2026-07-25T11:00',
        },
      ]);
      expect(ar.computeLagLevel(now)).toBe('critical');
    });
  });

  // ── isLaggingFromMedian ──

  describe('isLaggingFromMedian', () => {
    const now = new Date('2026-08-01T12:00');

    function makeStudentWithLastActivity(completedAt: string) {
      return new StudentAr({
        uuid: crypto.randomUUID(),
        streamId: mockStreamId,
        userId: mockUserId,
        enrolledAt: '2026-07-01T00:00',
        status: 'active',
        currentStepId: mockStepId,
        steps: [
          {
            stepId: mockStepId,
            status: 'completed' as const,
            issuedAt: '2026-07-20T00:00',
            completedAt,
          },
        ],
        createdAt: '2026-07-01T00:00',
      });
    }

    test('студент без шагов — false', () => {
      const ar = new StudentAr({
        uuid: crypto.randomUUID(),
        streamId: mockStreamId,
        userId: mockUserId,
        enrolledAt: '2026-07-01T00:00',
        status: 'active',
        currentStepId: mockStepId,
        steps: [],
        createdAt: '2026-07-01T00:00',
      });
      expect(ar.isLaggingFromMedian(100)).toBe(false);
    });

    test('студент быстрее медианы — false', () => {
      const ar = makeStudentWithLastActivity('2026-07-30T12:00');
      // 2 дня = 48 часов. Медиана = 100 часов. 48 < 130.
      expect(ar.isLaggingFromMedian(100)).toBe(false);
    });

    test('медиана 0 — false', () => {
      const ar = makeStudentWithLastActivity('2026-07-30T12:00');
      expect(ar.isLaggingFromMedian(0)).toBe(false);
    });
  });
});
