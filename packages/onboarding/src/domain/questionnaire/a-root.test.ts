import { describe, expect, test } from 'bun:test';
import { QuestionnaireAr } from './a-root';
import type { Question } from './question';
import { QuestionPoolService } from './question-pool-service';

const testPool: Question[] = [
  {
    question: 'Первый вопрос',
    questionCode: 'q1',
    type: 'choice',
    multiple: false,
    answers: [
      { answer: 'Да', answerCode: 'yes' },
      { answer: 'Нет', answerCode: 'no' },
    ],
  },
  {
    question: 'Условный вопрос',
    questionCode: 'q2',
    type: 'choice',
    multiple: false,
    condition: { questionCode: 'q1', answerCodes: ['yes'] },
    answers: [{ answer: 'Ок', answerCode: 'ok' }],
  },
  {
    question: 'Текстовый вопрос',
    questionCode: 'q3',
    type: 'text',
  },
  {
    question: 'Множественный выбор',
    questionCode: 'q4',
    type: 'choice',
    multiple: true,
    answers: [
      { answer: 'A', answerCode: 'a' },
      { answer: 'B', answerCode: 'b' },
    ],
  },
];

/** Коды вопросов, включённых в анкету (подмножество пула) */
const includedQuestionCodes = ['q1', 'q2', 'q3', 'q4'];

describe('QuestionnaireAr', () => {
  test('start создаёт анкету и определяет первый вопрос', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(ar.getCurrentState().currentQuestionCode).toBe('q1');
    expect(ar.getCurrentState().answers).toHaveLength(0);
    expect(ar.getCurrentState().draftAnswers).toEqual([]);
  });

  test('прохождение полной анкеты с ветвлением (yes → q2 → q3 → q4)', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    let res = ar.handleAction('q1', 'yes');
    expect(res.type).toBe('new_question');
    expect((res as any).question.questionCode).toBe('q2');

    res = ar.handleAction('q2', 'ok');
    expect(res.type).toBe('new_question');
    expect((res as any).question.questionCode).toBe('q3');

    res = ar.handleAction('q3', 'hello');
    expect(res.type).toBe('new_question');
    expect((res as any).question.questionCode).toBe('q4');

    // q4 - множественный выбор. Переключаем черновики
    res = ar.handleAction('q4', 'a');
    expect(res.type).toBe('wait_next');
    expect((res as any).selectedAnswers).toEqual(['a']);

    res = ar.handleAction('q4', 'b');
    expect(res.type).toBe('wait_next');
    expect((res as any).selectedAnswers).toEqual(['a', 'b']);

    // Подтверждаем
    res = ar.handleAction('q4', 'NEXT');
    expect(res.type).toBe('completed');

    expect(ar.getCurrentState().status).toBe('completed');
    expect(ar.getAnswers()).toHaveLength(4);
  });

  test('ветвление: no → пропускает q2 → сразу q3', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    const res = ar.handleAction('q1', 'no');
    expect(ar.getCurrentState().currentQuestionCode).toBe('q3');
    expect(res.type).toBe('new_question');
  });

  test('валидация single choice — отклоняет неверный код', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    expect(() => ar.handleAction('q1', 'invalid')).toThrow();
  });

  test('валидация multiple choice — отклоняет пустой массив при NEXT', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction('q1', 'no');
    ar.handleAction('q3', 'hello');

    // q4 пустой черновик
    expect(() => ar.handleAction('q4', 'NEXT')).toThrow();
  });

  test('валидация text — отклоняет пустую строку', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction('q1', 'yes');
    ar.handleAction('q2', 'ok');

    expect(() => ar.handleAction('q3', '')).toThrow();
  });

  test('ошибка при попытке ответить на завершённую анкету', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction('q1', 'no');
    ar.handleAction('q3', 'hello');
    ar.handleAction('q4', 'a');
    ar.handleAction('q4', 'NEXT');

    expect(() => ar.handleAction('q4', 'a')).toThrow('Анкета уже завершена');
  });

  test('ошибка при ответе не на текущий вопрос', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    expect(() => ar.handleAction('q3', 'hello')).toThrow('Ожидался вопрос');
  });

  test('abandon прерывает анкету', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.abandon();

    expect(ar.getCurrentState().status).toBe('abandoned');
  });

  test('getAnswers возвращает все ответы', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction('q1', 'no');
    ar.handleAction('q3', 'hello');
    ar.handleAction('q4', 'a');
    ar.handleAction('q4', 'NEXT');

    const answers = ar.getAnswers();
    expect(answers).toHaveLength(3);
    expect(answers[0]?.questionCode).toBe('q1');
    expect(answers[0]?.answerCodes).toEqual(['no']);
    expect(answers[1]?.textValue).toBe('hello');
  });

  test('переключение черновиков (multiple choice)', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction('q1', 'no');
    ar.handleAction('q3', 'test');

    // Выбираем A
    ar.handleAction('q4', 'a');
    expect(ar.getCurrentState().draftAnswers).toEqual(['a']);

    // Выбираем B -> стало [A, B]
    ar.handleAction('q4', 'b');
    expect(ar.getCurrentState().draftAnswers).toEqual(['a', 'b']);

    // Выбираем A снова -> удалилось, стало [B]
    ar.handleAction('q4', 'a');
    expect(ar.getCurrentState().draftAnswers).toEqual(['b']);

    // Подтверждаем
    const res = ar.handleAction('q4', 'NEXT');
    expect(ar.getCurrentState().status).toBe('completed');
    expect(ar.getAnswers()[2]?.answerCodes).toEqual(['b']);
    expect(res.selectedAnswers).toEqual(['b']);
  });

  test('ошибка: NEXT для не-множественного вопроса', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    expect(() => ar.handleAction('q1', 'NEXT')).toThrow(
      'Команда NEXT доступна только для вопросов с множественным выбором',
    );
  });

  test('ошибка: ответ на неверный тип (массив для текста)', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction('q1', 'no'); // перешли на q3 (текст)

    expect(() => ar.handleAction('q3', ['invalid'] as any)).toThrow(
      'Для текстового вопроса ожидается строка',
    );
  });

  test('getNextQuestion: корректная работа при отсутствии ответов на условия', () => {
    const pool = new QuestionPoolService(
      [
        { question: 'Q0', questionCode: 'q0', type: 'text' },
        { question: 'Q1', questionCode: 'q1', type: 'text' },
        {
          question: 'Q2',
          questionCode: 'q2',
          type: 'text',
          condition: { questionCode: 'q0', answerCodes: ['x'] },
        },
      ],
      ['q1', 'q2'],
    );

    const ar = QuestionnaireAr.start(123456, pool);
    const res = ar.handleAction('q1', 'hello');

    // q2 имеет условие на q0, которого нет в ответах. Должно пропустить q2 и завершить.
    expect(res.type).toBe('completed');
  });
});
