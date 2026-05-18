import { describe, expect, test } from 'bun:test';
import { QuestionnaireAr } from './a-root';
import type { Question } from './question';
import { QuestionPoolService } from './question-pool-service';

// ── Test pool ──

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

// ── Tests ──

describe('QuestionnaireAr', () => {
  // ── Жизненный цикл ──

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

    // q4 — множественный выбор
    res = ar.handleAction(cb('a'));
    expect(res.type).toBe('wait_next');
    expect((res as any).selectedAnswers).toEqual(['a']);
    expect((res as any).nextButton).toBe('next:q4');

    res = ar.handleAction(cb('b'));
    expect(res.type).toBe('wait_next');
    expect((res as any).selectedAnswers).toEqual(['a', 'b']);

    // Подтверждаем через next:<code>
    res = ar.handleAction(cb('next:q4'));
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

  test('abandon прерывает анкету', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.abandon();
    expect(ar.getCurrentState().status).toBe('abandoned');
  });

  test('ошибка при попытке ответить на завершённую анкету', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('hello'));
    ar.handleAction(cb('a'));
    ar.handleAction(cb('next:q4'));

    expect(() => ar.handleAction(cb('a'))).toThrow('Анкета уже завершена');
  });

  // ── Валидация ответов ──

  test('валидация single choice — отклоняет неверный код', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    expect(() => ar.handleAction(cb('invalid'))).toThrow();
  });

  test('валидация multiple choice — отклоняет пустой черновик при next', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('hello'));

    // q4 — множественный, черновик пуст, next должен упасть на валидации
    expect(() => ar.handleAction(cb('next:q4'))).toThrow();
  });

  test('валидация text — отклоняет пустую строку', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('yes'));
    ar.handleAction(cb('ok'));

    expect(() => ar.handleAction(txt(''))).toThrow();
  });

  // ── nextButton ──

  test('nextButton появляется при множественном выборе с черновиками', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('test'));

    expect(ar.getCurrentState().draftAnswers).toEqual([]);

    const res = ar.handleAction(cb('a'));
    expect(res.type).toBe('wait_next');
    expect((res as any).nextButton).toBe('next:q4');
    expect((res as any).selectedAnswers).toEqual(['a']);

    // Сняли выбор — nextButton исчезает
    const res2 = ar.handleAction(cb('a'));
    expect(res2.type).toBe('wait_next');
    expect(res2.selectedAnswers).toEqual([]);
    expect((res2 as any).nextButton).toBeUndefined();
  });

  test('getNextButtonText форматирует корректно', () => {
    expect(QuestionnaireAr.getNextButtonText('q1')).toBe('next:q1');
    expect(QuestionnaireAr.getNextButtonText('source')).toBe('next:source');
  });

  // ── Защита от колбэков с предыдущих вопросов ──

  test('nextButton с чужим questionCode отклоняется', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('test'));

    // Мы на q4, но нажали «Далее» с q1
    expect(() => ar.handleAction(cb('next:q1'))).toThrow(
      'Кнопка «Далее» не соответствует текущему вопросу',
    );
  });

  test('nextButton для single choice отклоняется', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    expect(() => ar.handleAction(cb('next:q1'))).toThrow(
      'Команда next доступна только для вопросов с множественным выбором',
    );
  });

  test('nextButton для текстового вопроса отклоняется', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no')); // перешли на q3 (текст)

    expect(() => ar.handleAction(cb('next:q3'))).toThrow(
      'Команда next доступна только для вопросов с множественным выбором',
    );
  });

  // ── Несоответствие action.type и question.type ──

  test('текстовый ввод на choice вопрос отклоняется', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);

    expect(() => ar.handleAction(txt('hello'))).toThrow(
      'Ожидался ответ с выбором (нажатием кнопки)',
    );
  });

  test('текстовый ввод на choice+multiple вопрос отклоняется', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('test')); // перешли на q4

    expect(() => ar.handleAction(txt('hello'))).toThrow(
      'Ожидался ответ с выбором (нажатием кнопки)',
    );
  });

  test('колбэк на текстовый вопрос отклоняется', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no')); // перешли на q3 (текст)

    expect(() => ar.handleAction(cb('yes'))).toThrow(
      'Ожидался текстовый ответ',
    );
  });

  // ── Черновики ──

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

    const res = ar.handleAction(cb('next:q4'));
    expect(ar.getCurrentState().status).toBe('completed');
    expect(ar.getAnswers()[2]?.answerCodes).toEqual(['b']);
    expect(res.selectedAnswers).toEqual(['b']);
  });

  // ── Ответы ──

  test('getAnswers возвращает все ответы', () => {
    const pool = new QuestionPoolService(testPool, includedQuestionCodes);
    const ar = QuestionnaireAr.start(123456, pool);
    ar.handleAction(cb('no'));
    ar.handleAction(txt('hello'));
    ar.handleAction(cb('a'));
    ar.handleAction(cb('next:q4'));

    const answers = ar.getAnswers();
    expect(answers).toHaveLength(3);
    expect(answers[0]?.questionCode).toBe('q1');
    expect(answers[0]?.answerCodes).toEqual(['no']);
    expect(answers[1]?.textValue).toBe('hello');
  });

  // ── Ветвление ──

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
});
