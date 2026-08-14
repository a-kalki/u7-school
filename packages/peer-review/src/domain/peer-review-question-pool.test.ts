import { describe, expect, test } from 'bun:test';
import {
  CODE_REVIEW_POOL,
  MODULE_COMPLETED_POOL,
  PAIR_PROGRAMMING_POOL,
  PEER_REVIEW_POOLS,
} from './peer-review-question-pool';

describe('peer-review-question-pool', () => {
  test('пулы соответствуют источникам по количеству вопросов', () => {
    expect(MODULE_COMPLETED_POOL.questions.length).toBe(29);
    expect(PAIR_PROGRAMMING_POOL.questions.length).toBe(13);
    expect(CODE_REVIEW_POOL.questions.length).toBe(9);
  });

  test('questionCode уникальны внутри каждого пула и между пулами', () => {
    const seen = new Set<string>();
    for (const pool of Object.values(PEER_REVIEW_POOLS)) {
      for (const q of pool.questions) {
        expect(seen.has(q.questionCode)).toBe(false);
        seen.add(q.questionCode);
      }
    }
    expect(seen.size).toBe(29 + 13 + 9);
  });

  test('каждый вопрос содержит корректный вес', () => {
    for (const pool of Object.values(PEER_REVIEW_POOLS)) {
      for (const q of pool.questions) {
        expect([0.75, 1, 1.25]).toContain(q.skillMapping.weight);
      }
    }
  });

  test('каждый контекст из PEER_REVIEW_POOLS имеет непустой пул', () => {
    expect(Object.keys(PEER_REVIEW_POOLS).sort()).toEqual([
      'code_review',
      'module_completed',
      'pair_programming',
    ]);
    for (const pool of Object.values(PEER_REVIEW_POOLS)) {
      expect(pool.questions.length).toBeGreaterThan(0);
    }
  });
});
