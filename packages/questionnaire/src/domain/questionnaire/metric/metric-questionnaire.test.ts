import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
  MetricAssessmentSchema,
  MetricContextSchema,
  MetricRoleSchema,
} from './metric-questionnaire';

describe('MetricContext', () => {
  test('валидные контексты проходят', () => {
    for (const context of [
      'module_completed',
      'pair_programming',
      'code_review',
      'initiative',
    ]) {
      expect(() => v.parse(MetricContextSchema, context)).not.toThrow();
    }
  });

  test('неизвестный контекст — ошибка', () => {
    expect(() => v.parse(MetricContextSchema, 'unknown')).toThrow();
  });
});

describe('MetricRole', () => {
  test('валидные роли проходят', () => {
    for (const role of [
      'student_student',
      'mentor_student',
      'student_mentor',
    ]) {
      expect(() => v.parse(MetricRoleSchema, role)).not.toThrow();
    }
  });

  test('неизвестная роль — ошибка', () => {
    expect(() => v.parse(MetricRoleSchema, 'unknown')).toThrow();
  });
});

describe('MetricAssessment', () => {
  const valid = {
    context: 'module_completed',
    role: 'student_student',
    subjectId: '00000000-0000-0000-0000-000000000007',
  };

  test('валидный assessment проходит', () => {
    expect(() => v.parse(MetricAssessmentSchema, valid)).not.toThrow();
  });

  test('assessment с triggerEvent проходит', () => {
    expect(() =>
      v.parse(MetricAssessmentSchema, {
        ...valid,
        triggerEvent: { type: 'module_completed', aggregateId: 'agg-1' },
      }),
    ).not.toThrow();
  });

  test('subjectId не UUID — ошибка', () => {
    expect(() =>
      v.parse(MetricAssessmentSchema, { ...valid, subjectId: 'abc' }),
    ).toThrow();
  });

  test('без обязательных полей — ошибка', () => {
    expect(() => v.parse(MetricAssessmentSchema, {})).toThrow();
  });
});
