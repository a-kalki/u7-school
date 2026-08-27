import { afterAll, beforeAll, describe, expect, spyOn, test } from 'bun:test';
import * as Shared from '@u7-scl/core/shared';
import { StudentAr } from './a-root';
import type { Student } from './entity';

const mockStreamId = '11111111-1111-4111-8111-111111111111';
const mockUserId = '22222222-2222-4222-8222-222222222222';
const mockStepId = '33333333-3333-4333-8333-333333333333';
const mockModuleId = '44444444-4444-4444-8444-444444444444';

describe('StudentAr', () => {
  describe('enroll', () => {
    test('создаёт студента со статусом enrolled и пустыми шагами', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );

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
      expect(() =>
        StudentAr.enroll(mockStreamId, mockUserId, '', mockModuleId),
      ).toThrow();
    });

    test('enroll добавляет событие student.enrolled с полным payload', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );

      expect(ar.hasEvents()).toBe(true);
      const events = ar.flushEvents();
      expect(events).toHaveLength(1);

      const event = events[0]!;
      expect(event.eventName).toBe('student.enrolled');
      expect(event.aggregateName).toBe('Student');
      expect(event.aggregateId).toBe(ar.state.uuid);
      expect(event.eventId).toMatch(
        /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      );
      expect(event.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(event.payload).toEqual({
        studentId: ar.state.uuid,
        userId: mockUserId,
        streamId: mockStreamId,
        moduleId: mockModuleId,
      });
    });

    test('flushEvents очищает накопленные события (защита от повторной публикации)', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );

      expect(ar.flushEvents()).toHaveLength(1);
      expect(ar.hasEvents()).toBe(false);
      expect(ar.flushEvents()).toHaveLength(0);
    });
  });

  describe('activate', () => {
    test('переводит enrolled → active', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      expect(ar.status).toBe('enrolled');

      ar.activate();
      expect(ar.status).toBe('active');
    });

    test('активация не-enrolled → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate(); // теперь active
      expect(ar.status).toBe('active');

      expect(() => ar.activate()).toThrow(
        "Нельзя активировать студента в статусе 'active'.",
      );
    });

    test('активация abandoned → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.drop();
      expect(ar.status).toBe('abandoned');

      expect(() => ar.activate()).toThrow();
    });
  });

  describe('drop', () => {
    test('переводит active → abandoned (who=self, cause=voluntary)', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
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
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      // enrolled — нельзя дропнуть
      expect(() => ar.drop()).toThrow(
        "Нельзя отчислить студента в статусе 'enrolled'.",
      );
    });

    test('drop на advanced → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.advance(mockModuleId);
      expect(ar.status).toBe('advanced');

      expect(() => ar.drop()).toThrow();
    });
  });

  describe('markAbandoned', () => {
    test('переводит active → abandoned (who=mentor, cause=inactivity)', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();

      ar.markAbandoned('inactivity');
      expect(ar.status).toBe('abandoned');
      expect(ar.abandonDetails).toEqual({
        who: 'mentor',
        cause: 'inactivity',
      });
    });

    test('переводит active → abandoned (who=mentor, cause=by_mentor)', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();

      ar.markAbandoned('by_mentor');
      expect(ar.status).toBe('abandoned');
      expect(ar.abandonDetails).toEqual({
        who: 'mentor',
        cause: 'by_mentor',
      });
    });

    test('markAbandoned не из active → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      expect(() => ar.markAbandoned('inactivity')).toThrow();
    });
  });

  describe('advance', () => {
    test('переводит active → advanced c nextPreference=undecided', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();

      ar.advance(mockModuleId);
      expect(ar.status).toBe('advanced');
      expect(ar.completionDetails).toEqual({
        nextPreference: 'undecided',
      });
    });

    test('advance добавляет событие student.completed с outcome=advanced', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.flushEvents();

      ar.advance(mockModuleId);

      expect(ar.hasEvents()).toBe(true);
      const events = ar.flushEvents();
      expect(events).toHaveLength(1);
      const event = events[0]!;
      expect(event.eventName).toBe('student.completed');
      expect(event.aggregateName).toBe('Student');
      expect(event.aggregateId).toBe(ar.state.uuid);
      expect(event.payload).toEqual({
        studentId: ar.state.uuid,
        userId: mockUserId,
        streamId: mockStreamId,
        moduleId: mockModuleId,
        outcome: 'advanced',
      });
    });

    test('advance не из active → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      expect(() => ar.advance(mockModuleId)).toThrow();
    });

    test('сменить исход: not_advanced → advanced (событие не дублируется старым)', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.markNotAdvanced(mockModuleId);
      expect(ar.status).toBe('not_advanced');

      // Меняем исход
      ar.advance(mockModuleId);
      expect(ar.status).toBe('advanced');
      expect(ar.completionDetails).toEqual({
        nextPreference: 'undecided',
      });
    });
  });

  describe('markNotAdvanced', () => {
    test('переводит active → not_advanced c nextPreference=undecided', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();

      ar.markNotAdvanced(mockModuleId);
      expect(ar.status).toBe('not_advanced');
      expect(ar.completionDetails).toEqual({
        nextPreference: 'undecided',
      });
    });

    test('markNotAdvanced добавляет событие student.completed с outcome=not_advanced', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.flushEvents();

      ar.markNotAdvanced(mockModuleId);

      expect(ar.hasEvents()).toBe(true);
      const events = ar.flushEvents();
      expect(events).toHaveLength(1);
      const event = events[0]!;
      expect(event.eventName).toBe('student.completed');
      expect(event.payload).toEqual({
        studentId: ar.state.uuid,
        userId: mockUserId,
        streamId: mockStreamId,
        moduleId: mockModuleId,
        outcome: 'not_advanced',
      });
    });

    test('markNotAdvanced не из active → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      expect(() => ar.markNotAdvanced(mockModuleId)).toThrow();
    });

    test('сменить исход: advanced → not_advanced', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.advance(mockModuleId);
      expect(ar.status).toBe('advanced');

      // Меняем исход
      ar.markNotAdvanced(mockModuleId);
      expect(ar.status).toBe('not_advanced');
      expect(ar.completionDetails).toEqual({
        nextPreference: 'undecided',
      });
    });
  });

  describe('setNextPreference', () => {
    test('обновляет nextPreference у advanced студента', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.advance(mockModuleId);

      ar.setNextPreference('wants_next');
      expect(ar.completionDetails?.nextPreference).toBe('wants_next');
    });

    test('обновляет nextPreference у not_advanced студента', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.markNotAdvanced(mockModuleId);

      ar.setNextPreference('wants_repeat');
      expect(ar.completionDetails?.nextPreference).toBe('wants_repeat');
    });

    test('setNextPreference на active → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();

      expect(() => ar.setNextPreference('wants_next')).toThrow(
        "Нельзя установить предпочтение для студента в статусе 'active'.",
      );
    });

    test('setNextPreference на enrolled → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      expect(() => ar.setNextPreference('wants_next')).toThrow();
    });

    test('setNextPreference на abandoned → ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.drop();

      expect(() => ar.setNextPreference('wants_next')).toThrow();
    });
  });

  describe('issueStep', () => {
    test('добавляет StepRecord со статусом issued и обновляет currentStepId', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
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
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      const nextStepId = '44444444-4444-4444-8444-444444444444';

      ar.issueStep(nextStepId);

      expect(() => ar.issueStep(nextStepId)).toThrow();
    });
  });

  describe('completeStep', () => {
    test('завершает выданный шаг, выдаёт следующий и возвращает completed', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      const nextStepId = '44444444-4444-4444-8444-444444444444';
      const followingStepId = '55555555-5555-4555-8555-555555555555';

      ar.issueStep(nextStepId);
      const outcome = ar.completeStep(nextStepId, followingStepId);

      expect(outcome).toBe('completed');
      expect(ar.state.steps).toHaveLength(2);
      expect(ar.state.steps[0]?.stepId).toBe(nextStepId);
      expect(ar.state.steps[0]?.status).toBe('completed');
      expect(ar.state.steps[0]?.completedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      );
      expect(ar.state.steps[1]?.stepId).toBe(followingStepId);
      expect(ar.state.steps[1]?.status).toBe('issued');
      expect(ar.state.currentStepId).toBe(followingStepId);
    });

    test('завершает последний шаг (nextStepId=null) и возвращает finished', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );

      ar.issueStep(mockStepId);
      const outcome = ar.completeStep(mockStepId, null);

      expect(outcome).toBe('finished');
      expect(ar.state.steps).toHaveLength(1);
      expect(ar.state.steps[0]?.status).toBe('completed');
      expect(ar.state.currentStepId).toBe(mockStepId);
    });

    test('повторное завершение уже завершённого шага — already_completed без изменений', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      const nextStepId = '44444444-4444-4444-8444-444444444444';
      const followingStepId = '55555555-5555-4555-8555-555555555555';

      ar.issueStep(nextStepId);
      ar.completeStep(nextStepId, followingStepId);

      const stepsBefore = JSON.stringify(ar.state.steps);
      const currentBefore = ar.state.currentStepId;
      const completedAtBefore = ar.state.steps[0]?.completedAt;

      const outcome = ar.completeStep(nextStepId, followingStepId);

      expect(outcome).toBe('already_completed');
      expect(JSON.stringify(ar.state.steps)).toBe(stepsBefore);
      expect(ar.state.currentStepId).toBe(currentBefore);
      expect(ar.state.steps[0]?.completedAt).toBe(completedAtBefore);
    });

    test('выбрасывает ошибку если шаг не был выдан', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      const nextStepId = '44444444-4444-4444-8444-444444444444';

      expect(() => ar.completeStep(nextStepId, null)).toThrow();
    });
  });

  describe('недопустимые переходы', () => {
    test('abandoned → advanced — ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.drop();
      expect(ar.status).toBe('abandoned');

      expect(() => ar.advance(mockModuleId)).toThrow();
    });

    test('not_advanced → active — ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.markNotAdvanced(mockModuleId);
      expect(ar.status).toBe('not_advanced');

      expect(() => ar.activate()).toThrow();
    });

    test('advanced → active — ошибка', () => {
      const ar = StudentAr.enroll(
        mockStreamId,
        mockUserId,
        mockStepId,
        mockModuleId,
      );
      ar.activate();
      ar.advance(mockModuleId);
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
    let isoNowSpy: ReturnType<typeof spyOn>;

    beforeAll(() => {
      isoNowSpy = spyOn(Shared, 'isoNow').mockReturnValue('2026-08-01T12:00');
    });

    afterAll(() => {
      isoNowSpy.mockRestore();
    });

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
