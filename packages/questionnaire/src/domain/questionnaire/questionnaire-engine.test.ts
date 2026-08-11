import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import type { Question } from './question';
import { QuestionnaireEngine } from './questionnaire-engine';

describe('QuestionnaireEngine', () => {
  test('загружает и валидирует корректный пул', () => {
    const pool: Question[] = [
      {
        question: 'Текстовый',
        questionCode: 't1',
        type: 'text',
      },
      {
        question: 'Выбор',
        questionCode: 'c1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'Да', answerCode: 'yes' }],
      },
    ];
    const engine = new QuestionnaireEngine(pool, ['t1', 'c1']);
    const all = engine.getAll();
    expect(all.length).toBe(2);
  });

  test('getByCode возвращает вопрос по коду', () => {
    const pool: Question[] = [
      {
        question: 'Выбор',
        questionCode: 'c1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'Да', answerCode: 'yes' }],
      },
    ];
    const engine = new QuestionnaireEngine(pool, ['c1']);
    const q = engine.getByCode('c1');
    expect(q).toBeDefined();
    expect(q?.questionCode).toBe('c1');
  });

  test('buildValidationSchema для text — валидирует непустую строку', () => {
    const engine = new QuestionnaireEngine(
      [
        {
          question: 'Текстовый вопрос',
          questionCode: 'text_q',
          type: 'text',
        },
      ],
      ['text_q'],
    );
    const schema = engine.buildValidationSchema('text_q');
    expect(() => v.parse(schema, 'hello')).not.toThrow();
    expect(() => v.parse(schema, '')).toThrow();
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
    const engine = new QuestionnaireEngine(pool, ['q1']);
    const schema = engine.buildValidationSchema('q1');
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
    const engine = new QuestionnaireEngine(pool, ['q1']);
    const schema = engine.buildValidationSchema('q1');
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
        type: 'text',
      },
      {
        question: 'Q2',
        questionCode: 'dup',
        type: 'text',
      },
    ];
    expect(() => new QuestionnaireEngine(pool, ['dup'])).toThrow(
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
    expect(() => new QuestionnaireEngine(pool, ['q2'])).toThrow(
      'condition в вопросе "q2" ссылается на несуществующий questionCode: missing',
    );
  });

  test('падает если text-вопрос содержит answers', () => {
    const raw = [
      {
        question: 'Текстовый',
        questionCode: 't1',
        type: 'text',
        answers: [{ answer: 'Лишнее', answerCode: 'x' }],
      },
    ];
    expect(() => new QuestionnaireEngine(raw as any, ['t1'])).toThrow(
      'Текстовый вопрос "t1" не должен содержать answers',
    );
  });

  test('getNextQuestion находит следующий вопрос по порядку', () => {
    const pool: Question[] = [
      { question: 'Q1', questionCode: 'q1', type: 'text' },
      { question: 'Q2', questionCode: 'q2', type: 'text' },
    ];
    const engine = new QuestionnaireEngine(pool, ['q1', 'q2']);

    const next = engine.getNextQuestion(null, []);
    expect(next?.questionCode).toBe('q1');

    const next2 = engine.getNextQuestion('q1', [
      {
        questionCode: 'q1',
        questionText: 'Q1',
        answerCode: 'text',
        answerText: 'hello',
        choices: [],
        answeredAt: '2024-01-01T00:00',
      },
    ]);
    expect(next2?.questionCode).toBe('q2');

    const next3 = engine.getNextQuestion('q2', []);
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
        type: 'text',
        condition: { questionCode: 'q1', answerCodes: ['yes'] },
      },
      { question: 'Q3', questionCode: 'q3', type: 'text' },
    ];
    const engine = new QuestionnaireEngine(pool, ['q1', 'q2', 'q3']);

    const baseAnswer = {
      questionText: 'Q1',
      text: '',
      choices: [
        { code: 'yes', text: 'Yes' },
        { code: 'no', text: 'No' },
      ],
      answeredAt: '2024-01-01T00:00',
    };

    // С ответом 'yes' -> q2
    const nextWithYes = engine.getNextQuestion('q1', [
      {
        ...baseAnswer,
        questionCode: 'q1',
        answerCode: 'yes',
        answerText: 'Yes',
      },
    ]);
    expect(nextWithYes?.questionCode).toBe('q2');

    // С ответом 'no' -> пропускает q2, идёт в q3
    const nextWithNo = engine.getNextQuestion('q1', [
      { ...baseAnswer, questionCode: 'q1', answerCode: 'no', answerText: 'No' },
    ]);
    expect(nextWithNo?.questionCode).toBe('q3');
  });

  test('assertAllCodesExist падает при отсутствующем коде в includedCodes', () => {
    const pool: Question[] = [
      { question: 'Q1', questionCode: 'q1', type: 'text' },
    ];
    expect(() => new QuestionnaireEngine(pool, ['q1', 'missing'])).toThrow(
      'questionCode "missing" из includedQuestionCodes не найден в пуле',
    );
  });
});
