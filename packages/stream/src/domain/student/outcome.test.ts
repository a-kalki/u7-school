import { describe, expect, test } from 'bun:test';
import {
  AbandonSign,
  CompletionSign,
  StudentOutcomeCategory,
  studentNeverStarted,
  studentOutcomeCategory,
  studentOutcomeSigns,
  type StudentOutcomeInput,
} from './outcome';

/** Фабрика входа: активный студент без шагов по умолчанию */
const input = (overrides: Partial<StudentOutcomeInput> = {}): StudentOutcomeInput => ({
  status: 'active',
  steps: [],
  ...overrides,
});

/** Шаг в статусе completed (завершённый) */
const completedStep = {
  stepId: '33333333-3333-4333-8333-333333333333',
  status: 'completed' as const,
  issuedAt: '2026-09-01T10:00',
  completedAt: '2026-09-02T10:00',
};

/** Шаг в статусе issued (выдан, не завершён) */
const issuedStep = {
  stepId: '44444444-4444-4444-8444-444444444444',
  status: 'issued' as const,
  issuedAt: '2026-09-03T10:00',
};

describe('studentOutcomeCategory (категория исхода)', () => {
  test('advanced → завершение', () => {
    expect(studentOutcomeCategory(input({ status: 'advanced' }))).toBe(
      StudentOutcomeCategory.COMPLETED,
    );
  });

  test('not_advanced → завершение', () => {
    expect(studentOutcomeCategory(input({ status: 'not_advanced' }))).toBe(
      StudentOutcomeCategory.COMPLETED,
    );
  });

  test('abandoned → забросил (в том числе легаси без abandonDetails)', () => {
    expect(studentOutcomeCategory(input({ status: 'abandoned' }))).toBe(
      StudentOutcomeCategory.ABANDONED,
    );
    expect(
      studentOutcomeCategory(
        input({ status: 'abandoned', abandonDetails: undefined }),
      ),
    ).toBe(StudentOutcomeCategory.ABANDONED);
  });

  test('enrolled → нетерминальный', () => {
    expect(studentOutcomeCategory(input({ status: 'enrolled' }))).toBe(
      StudentOutcomeCategory.IN_PROGRESS,
    );
  });

  test('active → нетерминальный', () => {
    expect(studentOutcomeCategory(input({ status: 'active' }))).toBe(
      StudentOutcomeCategory.IN_PROGRESS,
    );
  });
});

describe('studentOutcomeSigns (признаки завершения и ухода)', () => {
  test('advanced → признак «прошёл»', () => {
    expect(studentOutcomeSigns(input({ status: 'advanced' }))).toEqual([
      CompletionSign.PASSED,
    ]);
  });

  test('not_advanced → признак «не прошёл»', () => {
    expect(studentOutcomeSigns(input({ status: 'not_advanced' }))).toEqual([
      CompletionSign.NOT_PASSED,
    ]);
  });

  test('enrolled / active — без признаков', () => {
    expect(studentOutcomeSigns(input({ status: 'enrolled' }))).toEqual([]);
    expect(studentOutcomeSigns(input({ status: 'active' }))).toEqual([]);
  });

  test('abandoned + voluntary, шаги завершались → «покинул сам»', () => {
    const src = input({
      status: 'abandoned',
      abandonDetails: { who: 'self', cause: 'voluntary' },
      steps: [completedStep],
    });
    expect(studentOutcomeSigns(src)).toEqual([AbandonSign.LEFT_VOLUNTARILY]);
  });

  test('abandoned + voluntary, шагов нет → «не начал» + «покинул сам»', () => {
    const src = input({
      status: 'abandoned',
      abandonDetails: { who: 'self', cause: 'voluntary' },
    });
    expect(studentOutcomeSigns(src)).toEqual([
      AbandonSign.NEVER_STARTED,
      AbandonSign.LEFT_VOLUNTARILY,
    ]);
  });

  test('abandoned + inactivity, шаги завершались → «снят ментором»', () => {
    const src = input({
      status: 'abandoned',
      abandonDetails: { who: 'mentor', cause: 'inactivity' },
      steps: [completedStep],
    });
    expect(studentOutcomeSigns(src)).toEqual([AbandonSign.REMOVED_BY_MENTOR]);
  });

  test('abandoned + inactivity, шагов нет → «не начал» + «снят ментором»', () => {
    const src = input({
      status: 'abandoned',
      abandonDetails: { who: 'mentor', cause: 'inactivity' },
    });
    expect(studentOutcomeSigns(src)).toEqual([
      AbandonSign.NEVER_STARTED,
      AbandonSign.REMOVED_BY_MENTOR,
    ]);
  });

  test('abandoned + by_mentor, шаги завершались → «снят ментором»', () => {
    const src = input({
      status: 'abandoned',
      abandonDetails: { who: 'mentor', cause: 'by_mentor' },
      steps: [completedStep],
    });
    expect(studentOutcomeSigns(src)).toEqual([AbandonSign.REMOVED_BY_MENTOR]);
  });

  test('abandoned + by_mentor, шагов нет → «не начал» + «снят ментором»', () => {
    const src = input({
      status: 'abandoned',
      abandonDetails: { who: 'mentor', cause: 'by_mentor' },
    });
    expect(studentOutcomeSigns(src)).toEqual([
      AbandonSign.NEVER_STARTED,
      AbandonSign.REMOVED_BY_MENTOR,
    ]);
  });

  test('легаси: abandoned без abandonDetails → без признаков ухода, не падает', () => {
    const src = input({ status: 'abandoned', abandonDetails: undefined });
    expect(studentOutcomeSigns(src)).toEqual([]);
  });

  test('выданные, но не завершённые шаги — не «начал»', () => {
    const src = input({
      status: 'abandoned',
      abandonDetails: { who: 'self', cause: 'voluntary' },
      steps: [issuedStep],
    });
    expect(studentOutcomeSigns(src)).toEqual([
      AbandonSign.NEVER_STARTED,
      AbandonSign.LEFT_VOLUNTARILY,
    ]);
  });
});

describe('studentNeverStarted (ФР-4: готовый признак для peer-review)', () => {
  test('abandoned без завершённых шагов → true', () => {
    expect(
      studentNeverStarted(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'self', cause: 'voluntary' },
        }),
      ),
    ).toBe(true);
  });

  test('abandoned с завершённым шагом → false', () => {
    expect(
      studentNeverStarted(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'self', cause: 'voluntary' },
          steps: [completedStep],
        }),
      ),
    ).toBe(false);
  });

  test('abandoned только с выданными шагами → true', () => {
    expect(
      studentNeverStarted(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'mentor', cause: 'inactivity' },
          steps: [issuedStep],
        }),
      ),
    ).toBe(true);
  });

  test('active без шагов → false (признак только у выбывших)', () => {
    expect(studentNeverStarted(input({ status: 'active' }))).toBe(false);
  });

  test('advanced → false', () => {
    expect(studentNeverStarted(input({ status: 'advanced' }))).toBe(false);
  });
});
