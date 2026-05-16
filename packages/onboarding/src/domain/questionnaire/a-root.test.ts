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
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);
    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(ar.getCurrentState().currentQuestionCode).toBe('q1');
    expect(ar.getCurrentState().answers).toHaveLength(0);
    expect(ar.getCurrentState().draftAnswers).toEqual([]);
  });

  test('прохождение полной анкеты с ветвлением (yes → q2 → q3 → q4)', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);

    ar.submitAnswer('q1', 'yes');
    expect(ar.getCurrentState().currentQuestionCode).toBe('q2');

    ar.submitAnswer('q2', 'ok');
    expect(ar.getCurrentState().currentQuestionCode).toBe('q3');

    ar.submitAnswer('q3', 'hello');
    expect(ar.getCurrentState().currentQuestionCode).toBe('q4');

    ar.submitAnswer('q4', ['a', 'b']);
    expect(ar.getCurrentState().currentQuestionCode).toBeNull();
    expect(ar.getCurrentState().status).toBe('completed');
    expect(ar.getAnswers()).toHaveLength(4);
  });

  test('ветвление: no → пропускает q2 → сразу q3', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);

    ar.submitAnswer('q1', 'no');
    expect(ar.getCurrentState().currentQuestionCode).toBe('q3');
  });

  test('валидация single choice — отклоняет неверный код', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);

    expect(() => ar.submitAnswer('q1', 'invalid')).toThrow();
  });

  test('валидация multiple choice — отклоняет пустой массив', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);
    ar.submitAnswer('q1', 'yes');
    ar.submitAnswer('q2', 'ok');
    ar.submitAnswer('q3', 'hello');

    expect(() => ar.submitAnswer('q4', [])).toThrow();
  });

  test('валидация text — отклоняет пустую строку', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);
    ar.submitAnswer('q1', 'yes');
    ar.submitAnswer('q2', 'ok');

    expect(() => ar.submitAnswer('q3', '')).toThrow();
  });

  test('ошибка при попытке ответить на завершённую анкету', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);
    ar.submitAnswer('q1', 'no');
    ar.submitAnswer('q3', 'hello');
    ar.submitAnswer('q4', ['a']);

    expect(() => ar.submitAnswer('q4', ['a'])).toThrow('Анкета уже завершена');
  });

  test('ошибка при ответе не на текущий вопрос', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);

    expect(() => ar.submitAnswer('q3', 'hello')).toThrow('Ожидался вопрос');
  });

  test('abandon прерывает анкету', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);
    ar.abandon();

    expect(ar.getCurrentState().status).toBe('abandoned');
    expect(ar.getCurrentState().currentQuestionCode).toBe('q1');
  });

  test('abandon на завершённой анкете ничего не меняет', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);
    ar.submitAnswer('q1', 'no');
    ar.submitAnswer('q3', 'hello');
    ar.submitAnswer('q4', ['a']);

    ar.abandon();
    expect(ar.getCurrentState().status).toBe('completed');
  });

  test('getAnswers возвращает все ответы', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);
    ar.submitAnswer('q1', 'no');
    ar.submitAnswer('q3', 'hello');
    ar.submitAnswer('q4', ['a']);

    const answers = ar.getAnswers();
    expect(answers).toHaveLength(3);
    expect(answers[0]?.questionCode).toBe('q1');
    expect(answers[0]?.answerCodes).toEqual(['no']);
    expect(answers[1]?.textValue).toBe('hello');
  });

  test('toggleDraftAnswer: добавляет и удаляет ответы, submitAnswer использует черновик', () => {
    const pool = new QuestionPoolService(testPool);
    const ar = QuestionnaireAr.start(123456, pool, includedQuestionCodes);

    // Одиночный выбор (q1)
    ar.toggleDraftAnswer('q1', 'no');
    expect(ar.getCurrentState().draftAnswers).toEqual(['no']);
    
    // Заменяет предыдущий
    ar.toggleDraftAnswer('q1', 'yes');
    expect(ar.getCurrentState().draftAnswers).toEqual(['yes']);
    
    // Удаляет (переключатель)
    ar.toggleDraftAnswer('q1', 'yes');
    expect(ar.getCurrentState().draftAnswers).toEqual([]);
    
    // Выбираем снова и отправляем
    ar.toggleDraftAnswer('q1', 'no');
    ar.submitAnswer('q1'); // без явного значения берет из черновика
    expect(ar.getCurrentState().currentQuestionCode).toBe('q3');
    expect(ar.getCurrentState().draftAnswers).toEqual([]);

    // Пропускаем q3 (текстовый)
    ar.submitAnswer('q3', 'test');

    // Множественный выбор (q4)
    ar.toggleDraftAnswer('q4', 'a');
    expect(ar.getCurrentState().draftAnswers).toEqual(['a']);
    
    // Добавляет к существующим
    ar.toggleDraftAnswer('q4', 'b');
    expect(ar.getCurrentState().draftAnswers).toEqual(['a', 'b']);
    
    // Отправляем черновик
    ar.submitAnswer('q4');
    expect(ar.getCurrentState().status).toBe('completed');
    expect(ar.getAnswers()[2]?.answerCodes).toEqual(['a', 'b']);
  });
});
