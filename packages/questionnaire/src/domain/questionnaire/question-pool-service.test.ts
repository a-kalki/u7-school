import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import type { Question } from './question';
import { QuestionPoolService } from './question-pool-service';

describe('QuestionPoolService', () => {
  test('загружает корректный пул из JSON', () => {
    const raw = QuestionPoolService.loadDefaultPool();
    const service = new QuestionPoolService(
      raw,
      raw.map((q) => q.questionCode),
    );
    const all = service.getAll();
    expect(all.length).toBe(10);
    expect(all[0]?.questionCode).toBe('how_found');
  });

  test('getByCode возвращает вопрос по коду', () => {
    const raw = QuestionPoolService.loadDefaultPool();
    const service = new QuestionPoolService(
      raw,
      raw.map((q) => q.questionCode),
    );
    const q = service.getByCode('intensity');
    expect(q).toBeDefined();
    expect(q?.questionCode).toBe('intensity');
  });

  test('buildValidationSchema для single choice — валидирует picklist', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [
          { answer: 'Yes', answerCode: 'yes' },
          { answer: 'No', answerCode: 'no' },
        ],
      },
    ];
    const service = new QuestionPoolService(pool, ['q1']);
    const schema = service.buildValidationSchema('q1');
    expect(() => v.parse(schema, 'yes')).not.toThrow();
    expect(() => v.parse(schema, 'maybe')).toThrow();
  });

  test('buildValidationSchema для multiple — валидирует массив', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: true,
        answers: [
          { answer: 'A', answerCode: 'a' },
          { answer: 'B', answerCode: 'b' },
        ],
      },
    ];
    const service = new QuestionPoolService(pool, ['q1']);
    const schema = service.buildValidationSchema('q1');
    expect(() => v.parse(schema, ['a'])).not.toThrow();
    expect(() => v.parse(schema, ['a', 'b'])).not.toThrow();
    expect(() => v.parse(schema, [])).toThrow();
    expect(() => v.parse(schema, ['c'])).toThrow();
  });

  test('падает при дублирующемся questionCode', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'dup',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'A', answerCode: 'a' }],
      },
      {
        question: 'Q2',
        questionCode: 'dup',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'B', answerCode: 'b' }],
      },
    ];
    expect(() => new QuestionPoolService(pool, ['dup'])).toThrow(
      'Дублирующийся questionCode: dup',
    );
  });

  test('падает при невалидном condition.questionCode', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'A', answerCode: 'a' }],
      },
      {
        question: 'Q2',
        questionCode: 'q2',
        type: 'choice',
        multiple: false,
        condition: { questionCode: 'missing', answerCodes: ['a'] },
        answers: [{ answer: 'B', answerCode: 'b' }],
      },
    ];
    expect(() => new QuestionPoolService(pool, ['q2'])).toThrow(
      'condition в вопросе "q2" ссылается на несуществующий questionCode: missing',
    );
  });

  test('getNextQuestion находит следующий вопрос по порядку', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'A', answerCode: 'a' }],
      },
      {
        question: 'Q2',
        questionCode: 'q2',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'B', answerCode: 'b' }],
      },
    ];
    const service = new QuestionPoolService(pool, ['q1', 'q2']);

    const next = service.getNextQuestion(null, []);
    expect(next?.questionCode).toBe('q1');

    const next2 = service.getNextQuestion('q1', [
      {
        questionCode: 'q1',
        questionText: 'Q1',
        answerCode: 'a',
        answerText: 'A',
        choices: [
          { code: 'a', text: 'A' },
          { code: 'b', text: 'B' },
        ],
        answeredAt: '2024-01-01T00:00',
      },
    ]);
    expect(next2?.questionCode).toBe('q2');

    const next3 = service.getNextQuestion('q2', []);
    expect(next3).toBeNull();
  });

  test('getNextQuestion учитывает условия (ветвление)', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [
          { answer: 'Yes', answerCode: 'yes' },
          { answer: 'No', answerCode: 'no' },
        ],
      },
      {
        question: 'Q2',
        questionCode: 'q2',
        type: 'choice',
        multiple: false,
        condition: { questionCode: 'q1', answerCodes: ['yes'] },
        answers: [{ answer: 'B', answerCode: 'b' }],
      },
      {
        question: 'Q3',
        questionCode: 'q3',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'C', answerCode: 'c' }],
      },
    ];
    const service = new QuestionPoolService(pool, ['q1', 'q2', 'q3']);

    const baseAnswer = {
      questionText: 'Q1',
      answerText: 'Yes',
      choices: [
        { code: 'yes', text: 'Yes' },
        { code: 'no', text: 'No' },
      ],
      answeredAt: '2024-01-01T00:00',
    };

    // С ответом 'yes' -> q2
    const nextWithYes = service.getNextQuestion('q1', [
      { ...baseAnswer, questionCode: 'q1', answerCode: 'yes' },
    ]);
    expect(nextWithYes?.questionCode).toBe('q2');

    // С ответом 'no' -> пропускает q2, идёт в q3
    const nextWithNo = service.getNextQuestion('q1', [
      { ...baseAnswer, questionCode: 'q1', answerCode: 'no', answerText: 'No' },
    ]);
    expect(nextWithNo?.questionCode).toBe('q3');
  });

  test('assertAllCodesExist падает при отсутствующем коде в includedCodes', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'A', answerCode: 'a' }],
      },
    ];
    expect(() => new QuestionPoolService(pool, ['q1', 'missing'])).toThrow(
      'questionCode "missing" из includedQuestionCodes не найден в пуле',
    );
  });
});
