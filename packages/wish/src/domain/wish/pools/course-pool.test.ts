import { describe, expect, test } from 'bun:test';
import { QuestionnairePoolSchema } from '@u7-scl/questionnaire/domain';
import * as v from 'valibot';
import coursePools from './course.json';
import { findCoursePool } from './course-pool';

const pooledCourseIds = Object.keys(coursePools);

describe('findCoursePool', () => {
  test('для каждого курса из course.json возвращает валидный пул', () => {
    expect(pooledCourseIds.length).toBeGreaterThan(0);

    for (const courseId of pooledCourseIds) {
      const pool = findCoursePool(courseId);
      expect(pool).toBeDefined();
      expect(v.safeParse(QuestionnairePoolSchema, pool).success).toBe(true);
    }
  });

  test('курс без пула — undefined', () => {
    const pool = findCoursePool(crypto.randomUUID());

    expect(pool).toBeUndefined();
  });
});
