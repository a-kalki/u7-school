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

const includedQuestionCodes = ['q1', 'q2', 'q3', 'q4'];

function cb(value: string) {
  return { type: 'callback' as const, value };
}
function txt(value: string) {
  return { type: 'text' as const, value };
}

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

    let res = ar.handleAction(cb('yes'));
    expect(res.type).toBe('new_question');
    expect((res as any).question.questionCode).toBe('q2');

    res = ar.handleAction(cb('ok'));
    expect(res.type).toBe('new_question');
    expect((res as any).question.questionCode).toBe('q3');

    res = ar.handleAction(txt('hello'));
    expect(res.type).toBe('new_question');
    expect((res as any).question.questionCode).toBe('q4');

    // q4 - множественный выбор. Переключаем черновики
    res = ar.handleAction(cb('a'));
    expect(res.type).toBe('wait_next');
    expect((res as any).selectedAnswers).toEqual(['a']);
    expect((res as any).nextButton).toBe('next:q4');

    res = ar.handleAction(cb('b'));
    expect(res.type).toBe('wait_next');
    expect((res as any).selectedAnswers).toEqual(['a', 'b']);

    // Подтверждаем
    res = ar.handleAction(cb('next'));
    expect(res.type).toBe('completed');

    expect(ar.getCurrentState().status).toBe('completed');
    expect(ar.getAnswers()).toHaveLength(4);
  });

  test('ветвление: no → пропускает q2 → сразу q3', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    const res = ar.handleAction(cb('no'));
    expect(ar.getCurrentState().currentQuestionCode).toBe('q3');
    expect(res.type).toBe('new_question');
  });

  test('валидация single choice — отклоняет неверный код', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    expect(() => ar.handleAction(cb('invalid'))).toThrow();
  });

  test('валидация multiple choice — отклоняет пустой массив при next', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('hello'));

    expect(() => ar.handleAction(cb('next'))).toThrow();
  });

  test('валидация text — отклоняет пустую строку', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('yes'));
    ar.handleAction(cb('ok'));

    expect(() => ar.handleAction(txt(''))).toThrow();
  });

  test('ошибка при попытке ответить на завершённую анкету', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('hello'));
    ar.handleAction(cb('a'));
    ar.handleAction(cb('next'));

    expect(() => ar.handleAction(cb('a'))).toThrow('Анкета уже завершена');
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
    ar.handleAction(cb('no'));
    ar.handleAction(txt('hello'));
    ar.handleAction(cb('a'));
    ar.handleAction(cb('next'));

    const answers = ar.getAnswers();
    expect(answers).toHaveLength(3);
    expect(answers[0]?.questionCode).toBe('q1');
    expect(answers[0]?.answerCodes).toEqual(['no']);
    expect(answers[1]?.textValue).toBe('hello');
  });

  test('переключение черновиков (multiple choice)', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('test'));

    ar.handleAction(cb('a'));
    expect(ar.getCurrentState().draftAnswers).toEqual(['a']);

    ar.handleAction(cb('b'));
    expect(ar.getCurrentState().draftAnswers).toEqual(['a', 'b']);

    ar.handleAction(cb('a'));
    expect(ar.getCurrentState().draftAnswers).toEqual(['b']);

    const res = ar.handleAction(cb('next'));
    expect(ar.getCurrentState().status).toBe('completed');
    expect(ar.getAnswers()[2]?.answerCodes).toEqual(['b']);
    expect(res.selectedAnswers).toEqual(['b']);
  });

  test('ошибка: next для не-множественного вопроса', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    expect(() => ar.handleAction(cb('next'))).toThrow(
      'Команда next доступна только для вопросов с множественным выбором',
    );
  });

  test('ошибка: ответ на неверный тип (массив для текста нельзя передать)', () => {
    // В новой сигнатуре value всегда string, массив передать невозможно.
    // Тест проверяет что текстовая валидация работает.
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no')); // перешли на q3 (текст)

    // Пустая строка на текстовый вопрос
    expect(() => ar.handleAction(txt(''))).toThrow();
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
    const res = ar.handleAction(txt('hello'));

    expect(res.type).toBe('completed');
  });

  test('nextButton появляется при множественном выборе с черновиками', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('test'));

    // После перехода на q4 черновики пусты
    expect(ar.getCurrentState().draftAnswers).toEqual([]);

    // Выбрали один — появляется nextButton
    const res = ar.handleAction(cb('a'));
    expect(res.type).toBe('wait_next');
    expect((res as any).nextButton).toBe('next:q4');
    expect((res as any).selectedAnswers).toEqual(['a']);

    // Сняли выбор — nextButton пропадает (draftAnswers пуст)
    const res2 = ar.handleAction(cb('a'));
    expect(res2.type).toBe('wait_next');
    expect(res2.selectedAnswers).toEqual([]);
  });

  test('selectedAnswers опционально в new_question и completed', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    // q1 single choice: сабмитим сразу, selectedAnswers опциональны
    const res = ar.handleAction(cb('yes'));
    expect(res.type).toBe('new_question');
    // selectedAnswers может быть пустым массивом (answerCodes от single choice)
  });
});
