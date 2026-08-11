import { describe, expect, test } from 'bun:test';
import { QuestionnaireAr } from './a-root';
import type { Question } from './question';
import { QuestionPoolService } from './question-pool-service';

function makePool(questions: Question[]): QuestionPoolService {
  return new QuestionPoolService(
    questions,
    questions.map((q) => q.questionCode),
  );
}

function makeSimplePool(): QuestionPoolService {
  return makePool([
    {
      question: 'Первый вопрос',
      questionCode: 'q1',
      type: 'choice' as const,
      multiple: false,
      answers: [
        { answer: 'Да', answerCode: 'yes' },
        { answer: 'Нет', answerCode: 'no' },
      ],
    },
    {
      question: 'Второй вопрос',
      questionCode: 'q2',
      type: 'choice' as const,
      multiple: false,
      answers: [{ answer: 'OK', answerCode: 'ok' }],
    },
  ]);
}

describe('QuestionnaireAr', () => {
  test('createIntention создаёт анкету в статусе intention', () => {
    const ar = QuestionnaireAr.createIntention(123);
    expect(ar.getRespondentId()).toBe(123);
    expect(ar.getCurrentState().status).toBe('intention');
    expect(ar.getCurrentState().questionPool).toBeNull();
    expect(ar.getCurrentState().answers).toEqual([]);
  });

  test('start переводит intention → in_progress и выдаёт первый вопрос', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.createIntention(123);
    const response = ar.start(pool);

    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(ar.getCurrentState().questionPool).not.toBeNull();
    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q1');
    }
  });

  test('start на не-intention анкете выбрасывает ошибку', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.startNew(123, pool);
    expect(() => ar.start(pool)).toThrow();
  });

  test('startNew создаёт анкету сразу в in_progress', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.startNew(123, pool);

    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(ar.getCurrentState().questionPool).not.toBeNull();
    expect(ar.currentQuestionCode).toBe('q1');
  });

  test('handleAction с одиночным выбором — фиксирует ответ и переходит дальше', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.startNew(123, pool);

    const response = ar.handleAction({ type: 'callback', value: 'yes' }, pool);

    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q2');
    }

    const answers = ar.getAnswers();
    expect(answers.length).toBe(1);
    expect(answers[0]?.questionCode).toBe('q1');
    expect(answers[0]?.answerCode).toBe('yes');
    expect(answers[0]?.questionText).toBe('Первый вопрос');
    expect(answers[0]?.answerText).toBe('Да');
    // Полный контекст choices
    expect(answers[0]?.choices).toEqual([
      { code: 'yes', text: 'Да' },
      { code: 'no', text: 'Нет' },
    ]);
  });

  test('handleAction завершает анкету после последнего вопроса', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.startNew(123, pool);

    // Отвечаем на первый
    ar.handleAction({ type: 'callback', value: 'yes' }, pool);
    // Отвечаем на второй (последний)
    const response = ar.handleAction({ type: 'callback', value: 'ok' }, pool);

    expect(response.type).toBe('completed');
    expect(ar.isCompleted()).toBe(true);
    expect(ar.getAnswers().length).toBe(2);
  });

  test('handleAction с multiple choice — toggle черновиков', () => {
    const pool = makePool([
      {
        question: 'Множественный',
        questionCode: 'mq',
        type: 'choice' as const,
        multiple: true,
        answers: [
          { answer: 'A', answerCode: 'a' },
          { answer: 'B', answerCode: 'b' },
          { answer: 'C', answerCode: 'c' },
        ],
      },
      {
        question: 'Последний',
        questionCode: 'last',
        type: 'choice' as const,
        multiple: false,
        answers: [{ answer: 'X', answerCode: 'x' }],
      },
    ]);
    const ar = QuestionnaireAr.startNew(123, pool);

    // Выбираем A
    const r1 = ar.handleAction({ type: 'callback', value: 'a' }, pool);
    expect(r1.type).toBe('wait_next');
    if (r1.type === 'wait_next') {
      expect(r1.selectedAnswers).toEqual(['a']);
      expect(r1.nextButton).toBeDefined();
    }

    // Выбираем B (добавляем)
    const r2 = ar.handleAction({ type: 'callback', value: 'b' }, pool);
    if (r2.type === 'wait_next') {
      expect(r2.selectedAnswers).toContain('a');
      expect(r2.selectedAnswers).toContain('b');
    }

    // Убираем A
    const r3 = ar.handleAction({ type: 'callback', value: 'a' }, pool);
    if (r3.type === 'wait_next') {
      expect(r3.selectedAnswers).toEqual(['b']);
    }

    // Сабмитим через next
    const r4 = ar.handleAction(
      { type: 'callback', value: QuestionnaireAr.getNextButtonText('mq') },
      pool,
    );
    expect(r4.type).toBe('new_question');
    if (r4.type === 'new_question') {
      expect(r4.question.questionCode).toBe('last');
    }

    const answers = ar.getAnswers();
    expect(answers.length).toBe(1);
    expect(answers[0]?.answerCode).toBe('b');
  });

  test('abandon переводит анкету в abandoned', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.startNew(123, pool);

    ar.abandon();
    expect(ar.getCurrentState().status).toBe('abandoned');
    // Повторный abandon не падает
    ar.abandon();
  });

  test('abandon на completed анкете — без эффекта', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.startNew(123, pool);
    ar.handleAction({ type: 'callback', value: 'yes' }, pool);
    ar.handleAction({ type: 'callback', value: 'ok' }, pool);

    ar.abandon();
    expect(ar.getCurrentState().status).toBe('completed');
  });

  test('handleAction на завершённой анкете выбрасывает ошибку', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.startNew(123, pool);
    ar.handleAction({ type: 'callback', value: 'yes' }, pool);
    ar.handleAction({ type: 'callback', value: 'ok' }, pool);

    expect(() =>
      ar.handleAction({ type: 'callback', value: 'ok' }, pool),
    ).toThrow('Анкета уже завершена');
  });

  test('getQuestionnaireActionResponse возвращает текущий вопрос', () => {
    const pool = makeSimplePool();
    const ar = QuestionnaireAr.startNew(123, pool);

    const resp = ar.getQuestionnaireActionResponse(pool);
    expect(resp.type).toBe('new_question');
    if (resp.type === 'new_question') {
      expect(resp.question.questionCode).toBe('q1');
    }
  });

  test('getQuestionnaireActionResponse на intention выбрасывает', () => {
    const ar = QuestionnaireAr.createIntention(123);
    const pool = makeSimplePool();
    expect(() => ar.getQuestionnaireActionResponse(pool)).toThrow(
      'Анкета ещё не запущена',
    );
  });
});
