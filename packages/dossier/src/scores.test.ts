import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { SkillScoreSchema } from './scores';

describe('SkillScore', () => {
  test('валидный балл проходит', () => {
    const score = {
      category: 'personal_skills',
      subcategory: 'enthusiasm',
      score: 4.2,
    };
    expect(() => v.parse(SkillScoreSchema, score)).not.toThrow();
  });

  test('балл больше 5 — ошибка', () => {
    const score = {
      category: 'personal_skills',
      subcategory: 'enthusiasm',
      score: 6,
    };
    expect(() => v.parse(SkillScoreSchema, score)).toThrow();
  });

  test('балл меньше 1 — ошибка', () => {
    const score = {
      category: 'personal_skills',
      subcategory: 'enthusiasm',
      score: 0.5,
    };
    expect(() => v.parse(SkillScoreSchema, score)).toThrow();
  });

  test('подкатегория другой категории — ошибка', () => {
    const score = {
      category: 'personal_skills',
      subcategory: 'tooling',
      score: 4,
    };
    expect(() => v.parse(SkillScoreSchema, score)).toThrow();
  });
});
