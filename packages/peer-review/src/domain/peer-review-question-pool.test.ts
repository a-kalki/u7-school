import { describe, expect, test } from 'bun:test';
import {
  CODE_REVIEW_POOL,
  METRIC_POOLS,
  MODULE_COMPLETED_POOL,
  PAIR_PROGRAMMING_POOL,
} from './metric-question-pool';

describe('metric-question-pool', () => {
  test('пулы соответствуют источникам по количеству вопросов', () => {
    expect(MODULE_COMPLETED_POOL.questions.length).toBe(29);
    expect(PAIR_PROGRAMMING_POOL.questions.length).toBe(13);
    expect(CODE_REVIEW_POOL.questions.length).toBe(9);
  });

  test('questionCode уникальны внутри каждого пула и между пулами', () => {
    const seen = new Set<string>();
    for (const pool of Object.values(METRIC_POOLS)) {
      for (const q of pool.questions) {
        expect(seen.has(q.questionCode)).toBe(false);
        seen.add(q.questionCode);
      }
    }
    expect(seen.size).toBe(29 + 13 + 9);
  });

  test('каждый вопрос содержит корректный вес', () => {
    for (const pool of Object.values(METRIC_POOLS)) {
      for (const q of pool.questions) {
        expect([0.75, 1, 1.25]).toContain(q.metricMapping.weight);
      }
    }
  });

  test('каждый контекст из METRIC_POOLS имеет непустой пул', () => {
    expect(Object.keys(METRIC_POOLS).sort()).toEqual([
      'code_review',
      'module_completed',
      'pair_programming',
    ]);
    for (const pool of Object.values(METRIC_POOLS)) {
      expect(pool.questions.length).toBeGreaterThan(0);
    }
  });
});
