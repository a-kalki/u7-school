import { describe, expect, test } from 'bun:test';
import {
  AbandonSign,
  CompletionSign,
  type StudentOutcomeInput,
} from './outcome';
import {
  STUDENT_OUTCOME_SIGN_LABELS,
  studentOutcomeDetailLabel,
  studentOutcomeLabel,
} from './outcome-labels';

/** Фабрика входа: активный студент без шагов по умолчанию */
const input = (
  overrides: Partial<StudentOutcomeInput> = {},
): StudentOutcomeInput => ({
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

describe('STUDENT_OUTCOME_SIGN_LABELS (словарь меток, ФР-2)', () => {
  test('канонические строки из спецификации', () => {
    expect(STUDENT_OUTCOME_SIGN_LABELS[CompletionSign.PASSED]).toBe('окончил');
    expect(STUDENT_OUTCOME_SIGN_LABELS[CompletionSign.NOT_PASSED]).toBe(
      'окончил, не прошёл',
    );
    expect(STUDENT_OUTCOME_SIGN_LABELS[AbandonSign.NEVER_STARTED]).toBe(
      'не начал',
    );
    expect(STUDENT_OUTCOME_SIGN_LABELS[AbandonSign.LEFT_VOLUNTARILY]).toBe(
      'покинул сам',
    );
    expect(STUDENT_OUTCOME_SIGN_LABELS[AbandonSign.REMOVED_BY_MENTOR]).toBe(
      'снят ментором',
    );
  });

  test('категории также имеют канонические метки', () => {
    expect(STUDENT_OUTCOME_SIGN_LABELS.abandoned).toBe('забросил');
    expect(STUDENT_OUTCOME_SIGN_LABELS.in_progress).toBe('учится');
  });
});

describe('studentOutcomeLabel (главный лейбл исхода)', () => {
  test('advanced → «окончил»', () => {
    expect(studentOutcomeLabel(input({ status: 'advanced' }))).toBe('окончил');
  });

  test('not_advanced → «окончил, не прошёл»', () => {
    expect(studentOutcomeLabel(input({ status: 'not_advanced' }))).toBe(
      'окончил, не прошёл',
    );
  });

  test('enrolled / active → «учится»', () => {
    expect(studentOutcomeLabel(input({ status: 'enrolled' }))).toBe('учится');
    expect(studentOutcomeLabel(input({ status: 'active' }))).toBe('учится');
  });

  test('abandoned + voluntary → «покинул сам»', () => {
    expect(
      studentOutcomeLabel(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'self', cause: 'voluntary' },
          steps: [completedStep],
        }),
      ),
    ).toBe('покинул сам');
  });

  test('abandoned + by_mentor → «снят ментором»', () => {
    expect(
      studentOutcomeLabel(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'mentor', cause: 'by_mentor' },
          steps: [completedStep],
        }),
      ),
    ).toBe('снят ментором');
  });

  test('abandoned + inactivity → «снят ментором»', () => {
    expect(
      studentOutcomeLabel(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'mentor', cause: 'inactivity' },
          steps: [completedStep],
        }),
      ),
    ).toBe('снят ментором');
  });

  test('приоритет «не начал»: не начал + покинул сам → «не начал»', () => {
    expect(
      studentOutcomeLabel(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'self', cause: 'voluntary' },
        }),
      ),
    ).toBe('не начал');
  });

  test('приоритет «не начал»: не начал + снят ментором → «не начал»', () => {
    expect(
      studentOutcomeLabel(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'mentor', cause: 'inactivity' },
        }),
      ),
    ).toBe('не начал');
  });

  test('легаси: abandoned без деталей, шаги были → «забросил»', () => {
    expect(
      studentOutcomeLabel(
        input({
          status: 'abandoned',
          abandonDetails: undefined,
          steps: [completedStep],
        }),
      ),
    ).toBe('забросил');
  });

  test('легаси: abandoned без деталей, шагов нет → «не начал»', () => {
    expect(studentOutcomeLabel(input({ status: 'abandoned' }))).toBe(
      'не начал',
    );
  });
});

describe('studentOutcomeDetailLabel (составные лейблы карточек)', () => {
  test('не начал + покинул сам → «не начал · покинул сам»', () => {
    expect(
      studentOutcomeDetailLabel(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'self', cause: 'voluntary' },
        }),
      ),
    ).toBe('не начал · покинул сам');
  });

  test('не начал + снят ментором → «не начал · снят ментором»', () => {
    expect(
      studentOutcomeDetailLabel(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'mentor', cause: 'by_mentor' },
        }),
      ),
    ).toBe('не начал · снят ментором');
  });

  test('одиночный признак не получает разделитель', () => {
    expect(
      studentOutcomeDetailLabel(
        input({
          status: 'abandoned',
          abandonDetails: { who: 'mentor', cause: 'inactivity' },
          steps: [completedStep],
        }),
      ),
    ).toBe('снят ментором');
  });

  test('завершившие и учащиеся — без составных деталей', () => {
    expect(studentOutcomeDetailLabel(input({ status: 'advanced' }))).toBe(
      'окончил',
    );
    expect(studentOutcomeDetailLabel(input({ status: 'not_advanced' }))).toBe(
      'окончил, не прошёл',
    );
    expect(studentOutcomeDetailLabel(input({ status: 'active' }))).toBe(
      'учится',
    );
  });

  test('легаси с шагами → «забросил» без деталей', () => {
    expect(
      studentOutcomeDetailLabel(
        input({
          status: 'abandoned',
          abandonDetails: undefined,
          steps: [completedStep],
        }),
      ),
    ).toBe('забросил');
  });
});
