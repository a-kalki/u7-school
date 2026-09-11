import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import type { Answer } from './entity';
import type { Question } from './question';
import { QuestionnaireEngine } from './questionnaire-engine';

describe('QuestionnaireEngine', () => {
  test('загружает и валидирует корректный пул', () => {
    const pool: Question[] = [
      { question: 'Текстовый', questionCode: 't1', type: 'text' },
      {
        question: 'Выбор',
        questionCode: 'c1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'Да', answerCode: 'yes' }],
      },
    ];
    const engine = new QuestionnaireEngine(pool);
    expect(engine.getByCode('t1')).toBeDefined();
    expect(engine.getByCode('c1')).toBeDefined();
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
    const engine = new QuestionnaireEngine(pool);
    const q = engine.getByCode('c1');
    expect(q).toBeDefined();
    expect(q?.questionCode).toBe('c1');
  });

  test('buildValidationSchema для text — валидирует непустую строку', () => {
    const engine = new QuestionnaireEngine([
      { question: 'Текстовый вопрос', questionCode: 'text_q', type: 'text' },
    ]);
    const schema = engine.buildValidationSchema('text_q');
    expect(() => v.parse(schema, 'hello')).not.toThrow();
    expect(() => v.parse(schema, '')).toThrow();
  });

  test('buildValidationSchema для single choice — валидирует picklist', () => {
    const engine = new QuestionnaireEngine([
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
    ]);
    const schema = engine.buildValidationSchema('q1');
    expect(() => v.parse(schema, 'yes')).not.toThrow();
    expect(() => v.parse(schema, 'maybe')).toThrow();
  });

  test('buildValidationSchema для multiple — валидирует массив', () => {
    const engine = new QuestionnaireEngine([
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
    ]);
    const schema = engine.buildValidationSchema('q1');
    expect(() => v.parse(schema, ['a'])).not.toThrow();
    expect(() => v.parse(schema, ['a', 'b'])).not.toThrow();
    expect(() => v.parse(schema, [])).toThrow();
    expect(() => v.parse(schema, ['c'])).toThrow();
  });

  test('падает при дублирующемся questionCode', () => {
    const pool: Question[] = [
      { question: 'Q1', questionCode: 'dup', type: 'text' },
      { question: 'Q2', questionCode: 'dup', type: 'text' },
    ];
    expect(() => new QuestionnaireEngine(pool)).toThrow(
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
    expect(() => new QuestionnaireEngine(pool)).toThrow(
      'condition в вопросе "q2" ссылается на несуществующий questionCode: missing',
    );
  });

  test('падает если condition ссылается на более поздний вопрос («вперёд»)', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        condition: { questionCode: 'q2', answerCodes: ['b'] },
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
    expect(() => new QuestionnaireEngine(pool)).toThrow(
      'condition в вопросе "q1" ссылается на вопрос, стоящий позже в пуле: q2',
    );
  });

  test('падает если condition ссылается на самого себя', () => {
    const pool: Question[] = [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        condition: { questionCode: 'q1', answerCodes: ['a'] },
        answers: [{ answer: 'A', answerCode: 'a' }],
      },
    ];
    expect(() => new QuestionnaireEngine(pool)).toThrow(
      'condition в вопросе "q1" ссылается на вопрос, стоящий позже в пуле: q1',
    );
  });

  test('condition на более ранний вопрос — пул валиден', () => {
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
        type: 'text',
        condition: { questionCode: 'q1', answerCodes: ['a'] },
      },
    ];
    expect(() => new QuestionnaireEngine(pool)).not.toThrow();
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
    expect(() => new QuestionnaireEngine(raw as any)).toThrow(
      'Текстовый вопрос "t1" не должен содержать answers',
    );
  });

  test('getNextQuestion находит следующий вопрос по порядку', () => {
    const pool: Question[] = [
      { question: 'Q1', questionCode: 'q1', type: 'text' },
      { question: 'Q2', questionCode: 'q2', type: 'text' },
    ];
    const engine = new QuestionnaireEngine(pool);

    const next = engine.getNextQuestion(null, []);
    expect(next?.questionCode).toBe('q1');

    const next2 = engine.getNextQuestion('q1', [
      {
        questionCode: 'q1',
        answerCode: 'text',
        answerText: 'hello',
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
    const engine = new QuestionnaireEngine(pool);

    const baseAnswer = { answeredAt: '2024-01-01T00:00' };

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
});

describe('QuestionnaireEngine.getNextQuestion — any-of на multiple-вопросах', () => {
  const pool: Question[] = [
    {
      question: 'Дни недели',
      questionCode: 'days',
      type: 'choice',
      multiple: true,
      answers: [
        { answer: 'Пн', answerCode: 'mon' },
        { answer: 'Вт', answerCode: 'tue' },
        { answer: 'Ср', answerCode: 'wed' },
      ],
    },
    {
      question: 'Только для понедельника',
      questionCode: 'mon_followup',
      type: 'text',
      condition: { questionCode: 'days', answerCodes: ['mon'] },
    },
    { question: 'Финальный', questionCode: 'final', type: 'text' },
  ];

  const answeredAt = '2024-01-01T00:00';
  const daysAnswer = (answerCode: string): Answer[] => [
    { questionCode: 'days', answerCode, answeredAt },
  ];

  test("multiple-ответ 'mon,wed' матчится с condition answerCodes: ['mon']", () => {
    const engine = new QuestionnaireEngine(pool);
    const next = engine.getNextQuestion('days', daysAnswer('mon,wed'));
    expect(next?.questionCode).toBe('mon_followup');
  });

  test("multiple-ответ 'tue,mon' матчится, даже если мон не первый", () => {
    const engine = new QuestionnaireEngine(pool);
    const next = engine.getNextQuestion('days', daysAnswer('tue,mon'));
    expect(next?.questionCode).toBe('mon_followup');
  });

  test("multiple-ответ 'tue,wed' без пересечения — вопрос пропускается", () => {
    const engine = new QuestionnaireEngine(pool);
    const next = engine.getNextQuestion('days', daysAnswer('tue,wed'));
    expect(next?.questionCode).toBe('final');
  });

  test('одиночный ответ — тот же путь (split)', () => {
    const engine = new QuestionnaireEngine(pool);
    const next = engine.getNextQuestion('days', daysAnswer('mon'));
    expect(next?.questionCode).toBe('mon_followup');
  });
});

describe('QuestionnaireEngine.getProgress — динамический маршрут (реальный пул)', () => {
  // Миниатюра реального пула курса (packages/wish/.../pools/course.json):
  // 11 вопросов, из них 3 условных от intensity. Полный пул — 11,
  // но активный маршрут зависит от ветки: base — 10, intensive — 9.
  const pool: Question[] = [
    {
      question: 'Как ты нашел нас?',
      questionCode: 'how_found',
      type: 'choice',
      multiple: true,
      answers: [{ answer: 'Телеграм', answerCode: 'telegram' }],
    },
    {
      question: 'Почему мы заинтересовали?',
      questionCode: 'interest_reason',
      type: 'choice',
      multiple: true,
      answers: [{ answer: 'Профессионалы', answerCode: 'professionals' }],
    },
    {
      question: 'Опыт?',
      questionCode: 'experience',
      type: 'choice',
      multiple: false,
      answers: [{ answer: 'Новичок', answerCode: 'beginner' }],
    },
    {
      question: 'Язык?',
      questionCode: 'language',
      type: 'choice',
      multiple: false,
      answers: [{ answer: 'JS/TS', answerCode: 'js_ts' }],
    },
    {
      question: 'Формат?',
      questionCode: 'format',
      type: 'choice',
      multiple: false,
      answers: [{ answer: 'Офлайн', answerCode: 'offline' }],
    },
    {
      question: 'Темп и цели?',
      questionCode: 'goals',
      type: 'choice',
      multiple: false,
      answers: [{ answer: 'Fullstack', answerCode: 'fullstack' }],
    },
    {
      question: 'Интенсивность?',
      questionCode: 'intensity',
      type: 'choice',
      multiple: false,
      answers: [
        { answer: 'Базовый', answerCode: 'base' },
        { answer: 'Интенсивный', answerCode: 'intensive' },
      ],
    },
    {
      question: 'Дни недели?',
      questionCode: 'base_days',
      type: 'choice',
      multiple: true,
      condition: { questionCode: 'intensity', answerCodes: ['base'] },
      answers: [{ answer: 'Пн', answerCode: 'mon' }],
    },
    {
      question: 'Время занятий?',
      questionCode: 'base_time',
      type: 'choice',
      multiple: true,
      condition: { questionCode: 'intensity', answerCodes: ['base'] },
      answers: [{ answer: '9-11 утра', answerCode: '9_11' }],
    },
    {
      question: 'Время занятий?',
      questionCode: 'intensive_time',
      type: 'choice',
      multiple: false,
      condition: { questionCode: 'intensity', answerCodes: ['intensive'] },
      answers: [{ answer: 'До обеда', answerCode: 'before_noon' }],
    },
    {
      question: 'Чего хочешь достичь?',
      questionCode: 'goal_text',
      type: 'text',
    },
  ];

  const answeredAt = '2024-01-01T00:00';
  const answer = (questionCode: string, answerCode: string): Answer => ({
    questionCode,
    answerCode,
    answeredAt,
  });

  // Ответы на все вопросы до intensity включительно (как в реальном флоу)
  const baseAnswers: Answer[] = [
    answer('how_found', 'telegram'),
    answer('interest_reason', 'professionals'),
    answer('experience', 'beginner'),
    answer('language', 'js_ts'),
    answer('format', 'offline'),
    answer('goals', 'fullstack'),
    answer('intensity', 'base'),
  ];

  const intensiveAnswers: Answer[] = baseAnswers.map((a) =>
    a.questionCode === 'intensity' ? answer('intensity', 'intensive') : a,
  );

  test('base-ветка: total = 10 (без intensive_time), позиция по маршруту', () => {
    const engine = new QuestionnaireEngine(pool);
    expect(engine.getProgress('base_time', baseAnswers)).toEqual({
      index: 9,
      total: 10,
    });
    expect(engine.getProgress('goal_text', baseAnswers)).toEqual({
      index: 10,
      total: 10,
    });
  });

  test('intensive-ветка: total = 9 (без base_days и base_time)', () => {
    const engine = new QuestionnaireEngine(pool);
    expect(engine.getProgress('intensive_time', intensiveAnswers)).toEqual({
      index: 8,
      total: 9,
    });
    expect(engine.getProgress('goal_text', intensiveAnswers)).toEqual({
      index: 9,
      total: 9,
    });
  });

  test('вопрос чужой ветки не входит в активный маршрут — undefined', () => {
    const engine = new QuestionnaireEngine(pool);
    expect(engine.getProgress('base_days', intensiveAnswers)).toBeUndefined();
  });

  test('до ответа на intensity условные вопросы не в маршруте: total = 8', () => {
    const engine = new QuestionnaireEngine(pool);
    expect(engine.getProgress('intensity', baseAnswers.slice(0, 6))).toEqual({
      index: 7,
      total: 8,
    });
  });
});

describe('QuestionnaireEngine.getProgress', () => {
  const pool: Question[] = [
    { question: 'Один', questionCode: 'q1', type: 'text' },
    { question: 'Два', questionCode: 'q2', type: 'text' },
  ];

  test('возвращает 1-based позицию вопроса и размер пула', () => {
    const engine = new QuestionnaireEngine(pool);
    expect(engine.getProgress('q1', [])).toEqual({ index: 1, total: 2 });
    expect(engine.getProgress('q2', [])).toEqual({ index: 2, total: 2 });
  });

  test('неизвестный код вопроса — undefined', () => {
    const engine = new QuestionnaireEngine(pool);
    expect(engine.getProgress('nope', [])).toBeUndefined();
  });
});
