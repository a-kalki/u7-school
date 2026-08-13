import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { MetricMappingSchema, MetricScoreSchema } from './metric-types';

describe('MetricMapping', () => {
  test('валидная связь категория↔подкатегория проходит', () => {
    const mapping = {
      category: 'professional_skills',
      subcategory: 'work_quality',
      weight: 1.0,
    };
    expect(() => v.parse(MetricMappingSchema, mapping)).not.toThrow();
  });

  test('weight имеет значение по умолчанию 1.0', () => {
    const mapping = {
      category: 'team_skills',
      subcategory: 'communication',
    };
    const result = v.parse(MetricMappingSchema, mapping);
    expect(result.weight).toBe(1.0);
  });

  test('подкатегория другой категории — ошибка', () => {
    const mapping = {
      category: 'professional_skills',
      subcategory: 'communication',
      weight: 1.0,
    };
    expect(() => v.parse(MetricMappingSchema, mapping)).toThrow();
  });

  test('неизвестная категория — ошибка', () => {
    const mapping = {
      category: 'unknown',
      subcategory: 'work_quality',
      weight: 1.0,
    };
    expect(() => v.parse(MetricMappingSchema, mapping)).toThrow();
  });
});

describe('MetricScore', () => {
  test('валидный балл проходит', () => {
    const score = {
      category: 'personal_skills',
      subcategory: 'enthusiasm',
      score: 4.2,
    };
    expect(() => v.parse(MetricScoreSchema, score)).not.toThrow();
  });

  test('балл больше 5 — ошибка', () => {
    const score = {
      category: 'personal_skills',
      subcategory: 'enthusiasm',
      score: 6,
    };
    expect(() => v.parse(MetricScoreSchema, score)).toThrow();
  });

  test('балл меньше 1 — ошибка', () => {
    const score = {
      category: 'personal_skills',
      subcategory: 'enthusiasm',
      score: 0.5,
    };
    expect(() => v.parse(MetricScoreSchema, score)).toThrow();
  });

  test('подкатегория другой категории — ошибка', () => {
    const score = {
      category: 'personal_skills',
      subcategory: 'tooling',
      score: 4,
    };
    expect(() => v.parse(MetricScoreSchema, score)).toThrow();
  });
});
