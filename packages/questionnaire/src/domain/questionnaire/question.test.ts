import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import type { QuestionnairePool } from './question';
import { QuestionnairePoolSchema } from './question';

describe('QuestionnairePool', () => {
  test('валидный пул с минимальными полями', () => {
    const pool: QuestionnairePool = {
      questions: [
        {
          question: 'Q1',
          questionCode: 'q1',
          type: 'choice',
          multiple: false,
          answers: [{ answer: 'A', answerCode: 'a' }],
        },
      ],
    };
    expect(() => v.parse(QuestionnairePoolSchema, pool)).not.toThrow();
  });

  test('валидный пул со всеми полями', () => {
    const pool = {
      inviteText: 'Приглашаем пройти опрос',
      whyText: 'Это поможет улучшить метрики',
      completionText: 'Спасибо за ответы!',
      cancelWarning: 'Метрики не будут обновлены',
      questions: [
        {
          question: 'Q1',
          questionCode: 'q1',
          type: 'choice' as const,
          multiple: false,
          answers: [{ answer: 'A', answerCode: 'a' }],
        },
      ],
    };
    expect(() => v.parse(QuestionnairePoolSchema, pool)).not.toThrow();
  });

  test('questions — обязательное поле', () => {
    const pool = { inviteText: 'Test' };
    expect(() => v.parse(QuestionnairePoolSchema, pool)).toThrow();
  });

  test('пустой массив questions — ошибка', () => {
    const pool = { questions: [] };
    expect(() => v.parse(QuestionnairePoolSchema, pool)).toThrow();
  });

  test('невалидный вопрос в пуле — ошибка', () => {
    const pool = {
      questions: [
        {
          question: '',
          questionCode: '',
          type: 'choice',
          multiple: false,
          answers: [],
        },
      ],
    };
    expect(() => v.parse(QuestionnairePoolSchema, pool)).toThrow();
  });
});
