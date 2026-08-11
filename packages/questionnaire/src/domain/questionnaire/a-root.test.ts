import { describe, expect, test } from 'bun:test';
import { QuestionnaireAr } from './a-root';
import type { Question } from './question';
import { QuestionnaireEngine } from './questionnaire-engine';

function makeEngine(questions: Question[]): QuestionnaireEngine {
  return new QuestionnaireEngine(
    questions,
    questions.map((q) => q.questionCode),
  );
}

function makeSimpleEngine(): QuestionnaireEngine {
  return makeEngine([
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
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.createIntention(123);
    const response = ar.start(engine);

    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(ar.getCurrentState().questionPool).not.toBeNull();
    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q1');
    }
  });

  test('start на не-intention анкете выбрасывает ошибку', () => {
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.startNew(123, engine);
    expect(() => ar.start(engine)).toThrow();
  });

  test('startNew создаёт анкету сразу в in_progress', () => {
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.startNew(123, engine);

    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(ar.getCurrentState().questionPool).not.toBeNull();
    expect(ar.currentQuestionCode).toBe('q1');
  });

  test('handleAction с одиночным выбором — фиксирует ответ и переходит дальше', () => {
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.startNew(123, engine);

    const response = ar.handleAction(
      { type: 'callback', value: 'yes' },
      engine,
    );

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
    expect(answers[0]?.choices).toEqual([
      { code: 'yes', text: 'Да' },
      { code: 'no', text: 'Нет' },
    ]);
  });

  test('handleAction с текстовым вопросом — фиксирует текст', () => {
    const engine = makeEngine([
      {
        question: 'Расскажи о себе',
        questionCode: 'about',
        type: 'text' as const,
      },
      {
        question: 'Готово',
        questionCode: 'done',
        type: 'choice' as const,
        multiple: false,
        answers: [{ answer: 'OK', answerCode: 'ok' }],
      },
    ]);
    const ar = QuestionnaireAr.startNew(123, engine);

    const response = ar.handleAction(
      { type: 'text', value: 'Я разработчик' },
      engine,
    );

    expect(response.type).toBe('new_question');
    const answers = ar.getAnswers();
    expect(answers.length).toBe(1);
    expect(answers[0]?.answerCode).toBe('text');
    expect(answers[0]?.answerText).toBe('Я разработчик');
    expect(answers[0]?.questionText).toBe('Расскажи о себе');
  });

  test('handleAction завершает анкету после последнего вопроса', () => {
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.startNew(123, engine);

    ar.handleAction({ type: 'callback', value: 'yes' }, engine);
    const response = ar.handleAction({ type: 'callback', value: 'ok' }, engine);

    expect(response.type).toBe('completed');
    expect(ar.isCompleted()).toBe(true);
    expect(ar.getAnswers().length).toBe(2);
  });

  test('handleAction с multiple choice — toggle черновиков', () => {
    const engine = makeEngine([
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
    const ar = QuestionnaireAr.startNew(123, engine);

    const r1 = ar.handleAction({ type: 'callback', value: 'a' }, engine);
    expect(r1.type).toBe('wait_next');
    if (r1.type === 'wait_next') {
      expect(r1.selectedAnswers).toEqual(['a']);
      expect(r1.nextButton).toBeDefined();
    }

    const r2 = ar.handleAction({ type: 'callback', value: 'b' }, engine);
    if (r2.type === 'wait_next') {
      expect(r2.selectedAnswers).toContain('a');
      expect(r2.selectedAnswers).toContain('b');
    }

    const r3 = ar.handleAction({ type: 'callback', value: 'a' }, engine);
    if (r3.type === 'wait_next') {
      expect(r3.selectedAnswers).toEqual(['b']);
    }

    const r4 = ar.handleAction(
      { type: 'callback', value: QuestionnaireAr.getNextButtonText('mq') },
      engine,
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
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.startNew(123, engine);

    ar.abandon();
    expect(ar.getCurrentState().status).toBe('abandoned');
    ar.abandon(); // Повторный abandon не падает
  });

  test('abandon на completed анкете — без эффекта', () => {
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.startNew(123, engine);
    ar.handleAction({ type: 'callback', value: 'yes' }, engine);
    ar.handleAction({ type: 'callback', value: 'ok' }, engine);

    ar.abandon();
    expect(ar.getCurrentState().status).toBe('completed');
  });

  test('handleAction на завершённой анкете выбрасывает ошибку', () => {
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.startNew(123, engine);
    ar.handleAction({ type: 'callback', value: 'yes' }, engine);
    ar.handleAction({ type: 'callback', value: 'ok' }, engine);

    expect(() =>
      ar.handleAction({ type: 'callback', value: 'ok' }, engine),
    ).toThrow('Анкета уже завершена');
  });

  test('getQuestionnaireActionResponse возвращает текущий вопрос', () => {
    const engine = makeSimpleEngine();
    const ar = QuestionnaireAr.startNew(123, engine);

    const resp = ar.getQuestionnaireActionResponse(engine);
    expect(resp.type).toBe('new_question');
    if (resp.type === 'new_question') {
      expect(resp.question.questionCode).toBe('q1');
    }
  });

  test('getQuestionnaireActionResponse на intention выбрасывает', () => {
    const ar = QuestionnaireAr.createIntention(123);
    const engine = makeSimpleEngine();
    expect(() => ar.getQuestionnaireActionResponse(engine)).toThrow(
      'Анкета ещё не запущена',
    );
  });
});
