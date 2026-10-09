import { describe, expect, test } from 'bun:test';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student } from '../packages/stream/src/domain/student/entity';
import {
  analyzeSnapshotDelta,
  extractStepIds,
  syncAheadStudents,
} from './stream-snapshot-sync';

// Вспомогательная функция для генерации тестового снапшота
function makeSnapshot(
  structure: Array<{
    projectId: string;
    lessons: Array<{ lessonId: string; stepIds: string[] }>;
  }>,
): ContentSnapshot {
  return structure.map((p) => ({
    projectId: p.projectId,
    projectTitle: `Проект ${p.projectId}`,
    lessons: p.lessons.map((l) => ({
      lessonId: l.lessonId,
      lessonTitle: `Урок ${l.lessonId}`,
      stepIds: l.stepIds,
    })),
  }));
}

function makeStudent(override: Partial<Student>): Student {
  return {
    uuid: 'student-1',
    streamId: 'stream-1',
    userId: 'user-1',
    status: 'active',
    enrolledAt: '2026-09-01T10:00:00.000Z',
    currentStepId: 'step-1',
    steps: [],
    createdAt: '2026-09-01T10:00:00.000Z',
    ...override,
  };
}

describe('stream-snapshot-sync', () => {
  test('extractStepIds извлекает упорядоченный список шагов', () => {
    const snap = makeSnapshot([
      {
        projectId: 'p1',
        lessons: [
          { lessonId: 'l1', stepIds: ['s1', 's2'] },
          { lessonId: 'l2', stepIds: ['s3'] },
        ],
      },
    ]);
    expect(extractStepIds(snap)).toEqual(['s1', 's2', 's3']);
  });

  describe('analyzeSnapshotDelta', () => {
    test('без изменений — конфликтов нет', () => {
      const snap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's2'] }],
        },
      ]);
      const student = makeStudent({ currentStepId: 's2' });

      const res = analyzeSnapshotDelta(snap, snap, [student]);
      expect(res.addedStepIds).toEqual([]);
      expect(res.hasConflict).toBe(false);
      expect(res.aheadStudents).toEqual([]);
    });

    test('добавлен шаг в конец (хвост) после текущего студента — конфликта нет', () => {
      const oldSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's2'] }],
        },
      ]);
      const newSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's2', 's3-new'] }],
        },
      ]);
      const student = makeStudent({ currentStepId: 's2' });

      const res = analyzeSnapshotDelta(oldSnap, newSnap, [student]);
      expect(res.addedStepIds).toEqual(['s3-new']);
      expect(res.hasConflict).toBe(false);
      expect(res.aheadStudents).toEqual([]);
    });

    test('добавлен шаг позади текущего шага студента — фиксируется конфликт', () => {
      const oldSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's2'] }],
        },
        {
          projectId: 'p2',
          lessons: [{ lessonId: 'l2', stepIds: ['s3', 's4'] }],
        },
      ]);
      // Добавляем шаг s1_5 между s1 и s2
      const newSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's1_5-new', 's2'] }],
        },
        {
          projectId: 'p2',
          lessons: [{ lessonId: 'l2', stepIds: ['s3', 's4'] }],
        },
      ]);

      const studentBefore = makeStudent({
        uuid: 'stud-before',
        currentStepId: 's1',
      });
      const studentAhead = makeStudent({
        uuid: 'stud-ahead',
        currentStepId: 's3',
      });

      const res = analyzeSnapshotDelta(oldSnap, newSnap, [
        studentBefore,
        studentAhead,
      ]);
      expect(res.addedStepIds).toEqual(['s1_5-new']);
      expect(res.hasConflict).toBe(true);
      expect(res.aheadStudents.length).toBe(1);
      expect(res.aheadStudents[0]?.studentUuid).toBe('stud-ahead');
      expect(res.aheadStudents[0]?.newStepId).toBe('s1_5-new');
    });

    test('студент со статусом abandoned игнорируется при проверке конфликтов', () => {
      const oldSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's2'] }],
        },
      ]);
      const newSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s0-new', 's1', 's2'] }],
        },
      ]);
      const abandonedStudent = makeStudent({
        uuid: 'stud-dropped',
        status: 'abandoned',
        currentStepId: 's2',
      });

      const res = analyzeSnapshotDelta(oldSnap, newSnap, [abandonedStudent]);
      expect(res.hasConflict).toBe(false);
      expect(res.aheadStudents).toEqual([]);
    });

    test('студент со статусом advanced (завершил поток) считается опережающим', () => {
      const oldSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's2'] }],
        },
      ]);
      const newSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's1_5-new', 's2'] }],
        },
      ]);
      const graduatedStudent = makeStudent({
        uuid: 'stud-graduated',
        status: 'advanced',
        currentStepId: 's2',
      });

      const res = analyzeSnapshotDelta(oldSnap, newSnap, [graduatedStudent]);
      expect(res.hasConflict).toBe(true);
      expect(res.aheadStudents.length).toBe(1);
      expect(res.aheadStudents[0]?.studentUuid).toBe('stud-graduated');
    });
  });

  describe('syncAheadStudents', () => {
    test('добавляет новые шаги в steps только опережающим студентам', () => {
      const newSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's2-new', 's3'] }],
        },
      ]);

      const studBehind = makeStudent({
        uuid: 'stud-behind',
        currentStepId: 's1',
        steps: [
          { stepId: 's1', status: 'issued', issuedAt: '2026-09-01T10:00' },
        ],
      });

      const studAhead = makeStudent({
        uuid: 'stud-ahead',
        currentStepId: 's3',
        steps: [
          {
            stepId: 's1',
            status: 'completed',
            issuedAt: '2026-09-01T10:00',
            completedAt: '2026-09-01T11:00',
          },
          { stepId: 's3', status: 'issued', issuedAt: '2026-09-01T11:00' },
        ],
      });

      const students = [studBehind, studAhead];
      const result = syncAheadStudents(
        newSnap,
        students,
        ['s2-new'],
        '2026-10-09T12:00:00.000Z',
      );

      expect(result.updatedCount).toBe(1);
      expect(result.updatedStudentUuids).toEqual(['stud-ahead']);

      // studBehind не изменился
      expect(studBehind.steps.some((s) => s.stepId === 's2-new')).toBe(false);

      // studAhead получил step s2-new как completed
      const addedRecord = studAhead.steps.find((s) => s.stepId === 's2-new');
      expect(addedRecord).toBeDefined();
      expect(addedRecord?.status).toBe('completed');
      expect(addedRecord?.issuedAt).toBe('2026-10-09T12:00:00.000Z');
      expect(addedRecord?.completedAt).toBe('2026-10-09T12:00:00.000Z');
    });

    test('повторный вызов идемпотентен (не дублирует шаги)', () => {
      const newSnap = makeSnapshot([
        {
          projectId: 'p1',
          lessons: [{ lessonId: 'l1', stepIds: ['s1', 's2-new', 's3'] }],
        },
      ]);

      const studAhead = makeStudent({
        uuid: 'stud-ahead',
        currentStepId: 's3',
        steps: [
          {
            stepId: 's1',
            status: 'completed',
            issuedAt: '2026-09-01T10:00',
            completedAt: '2026-09-01T11:00',
          },
          { stepId: 's3', status: 'issued', issuedAt: '2026-09-01T11:00' },
        ],
      });

      const students = [studAhead];
      syncAheadStudents(newSnap, students, ['s2-new']);
      expect(studAhead.steps.length).toBe(3);

      // Второй вызов
      const secondRun = syncAheadStudents(newSnap, students, ['s2-new']);
      expect(secondRun.updatedCount).toBe(0);
      expect(studAhead.steps.length).toBe(3);
    });
  });
});
