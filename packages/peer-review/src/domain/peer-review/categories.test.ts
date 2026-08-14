import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
  SkillCategorySchema,
  SkillMappingSchema,
  SkillSubcategorySchema,
  SkillWeightSchema,
} from './categories';

describe('SkillCategory / SkillSubcategory / SkillWeight', () => {
  test('валидные категории проходят', () => {
    for (const category of [
      'professional_skills',
      'team_skills',
      'personal_skills',
    ]) {
      expect(() => v.parse(SkillCategorySchema, category)).not.toThrow();
    }
  });

  test('неизвестная категория — ошибка', () => {
    expect(() => v.parse(SkillCategorySchema, 'unknown')).toThrow();
  });

  test('все допустимые подкатегории проходят', () => {
    for (const subcategory of [
      'work_quality',
      'algorithmic_thinking',
      'tooling',
      'communication',
      'initiative',
      'honesty',
      'mutual_help',
      'enthusiasm',
      'responsibility',
      'regularity',
    ]) {
      expect(() => v.parse(SkillSubcategorySchema, subcategory)).not.toThrow();
    }
  });

  test('допустимые значения веса проходят', () => {
    for (const weight of [0.75, 1, 1.25]) {
      expect(() => v.parse(SkillWeightSchema, weight)).not.toThrow();
    }
  });

  test('недопустимый вес — ошибка', () => {
    expect(() => v.parse(SkillWeightSchema, 2)).toThrow();
  });
});

describe('SkillMapping', () => {
  test('валидная связь категория↔подкатегория проходит', () => {
    const mapping = {
      category: 'professional_skills',
      subcategory: 'work_quality',
      weight: 1.0,
    };
    expect(() => v.parse(SkillMappingSchema, mapping)).not.toThrow();
  });

  test('weight обязателен — отсутствие ошибка', () => {
    const mapping = {
      category: 'team_skills',
      subcategory: 'communication',
    };
    expect(() => v.parse(SkillMappingSchema, mapping)).toThrow();
  });

  test('недопустимый вес — ошибка', () => {
    const mapping = {
      category: 'team_skills',
      subcategory: 'communication',
      weight: 2,
    };
    expect(() => v.parse(SkillMappingSchema, mapping)).toThrow();
  });

  test('подкатегория другой категории — ошибка', () => {
    const mapping = {
      category: 'professional_skills',
      subcategory: 'communication',
      weight: 1.0,
    };
    expect(() => v.parse(SkillMappingSchema, mapping)).toThrow();
  });

  test('неизвестная категория — ошибка', () => {
    const mapping = {
      category: 'unknown',
      subcategory: 'work_quality',
      weight: 1.0,
    };
    expect(() => v.parse(SkillMappingSchema, mapping)).toThrow();
  });
});
