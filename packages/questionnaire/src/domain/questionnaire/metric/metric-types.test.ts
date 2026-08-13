import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
  MetricMappingSchema,
  MetricQuestionSchema,
  MetricScoreSchema,
} from './metric-types';

describe('MetricMapping', () => {
  test('валидная связь категория↔подкатегория проходит', () => {
    const mapping = {
      category: 'professional_skills',
      subcategory: 'work_quality',
      weight: 1.0,
    };
    expect(() => v.parse(MetricMappingSchema, mapping)).not.toThrow();
  });

  test('weight обязателен — отсутствие ошибка', () => {
    const mapping = {
      category: 'team_skills',
      subcategory: 'communication',
    };
    expect(() => v.parse(MetricMappingSchema, mapping)).toThrow();
  });

  test('допустимые значения веса проходят', () => {
    for (const weight of [0.75, 1, 1.25]) {
      const mapping = {
        category: 'team_skills',
        subcategory: 'communication',
        weight,
      };
      expect(() => v.parse(MetricMappingSchema, mapping)).not.toThrow();
    }
  });

  test('недопустимый вес — ошибка', () => {
    const mapping = {
      category: 'team_skills',
      subcategory: 'communication',
      weight: 2,
    };
    expect(() => v.parse(MetricMappingSchema, mapping)).toThrow();
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

describe('MetricQuestion', () => {
  test('вопрос с metricMapping проходит', () => {
    const q = {
      questionCode: 'mc_work_quality_1',
      question: 'Пишет код чисто',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    };
    expect(() => v.parse(MetricQuestionSchema, q)).not.toThrow();
  });

  test('вопрос без metricMapping — ошибка', () => {
    const q = {
      questionCode: 'mc_work_quality_1',
      question: 'Пишет код чисто',
    };
    expect(() => v.parse(MetricQuestionSchema, q)).toThrow();
  });

  test('metricMapping с невалидной связью — ошибка', () => {
    const q = {
      questionCode: 'mc_work_quality_1',
      question: 'Пишет код чисто',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'communication',
        weight: 1,
      },
    };
    expect(() => v.parse(MetricQuestionSchema, q)).toThrow();
  });

  test('пустой текст вопроса — ошибка', () => {
    const q = {
      questionCode: 'mc_work_quality_1',
      question: '',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    };
    expect(() => v.parse(MetricQuestionSchema, q)).toThrow();
  });
});
