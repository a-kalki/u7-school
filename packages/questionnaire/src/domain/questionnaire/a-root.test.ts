import { describe, expect, test } from 'bun:test';
import { QuestionnaireAr } from './a-root';
import type { Question } from './question';

function makePool(questions: Question[]): Question[] {
  return questions;
}

function simplePool(): Question[] {
  return [
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
  ];
}

describe('QuestionnaireAr', () => {
  // ── createIntention / start ──

  test('createIntention создаёт анкету в статусе intention', () => {
    const ar = QuestionnaireAr.createIntention(123);
    expect(ar.getRespondentId()).toBe(123);
    expect(ar.getCurrentState().status).toBe('intention');
    expect(ar.getCurrentState().questionPool).toBeNull();
    expect(ar.getAnswers()).toEqual([]);
  });

  test('getCurrent на intention возвращает IntentionResponse', () => {
    const ar = QuestionnaireAr.createIntention(123);
    const resp = ar.getCurrent();
    expect(resp.type).toBe('intention');
    if (resp.type === 'intention') {
      expect(resp.questionnaireId).toBe(ar.getCurrentState().uuid);
    }
  });

  test('start переводит intention → in_progress и выдаёт первый вопрос', () => {
    const ar = QuestionnaireAr.createIntention(123);
    const response = ar.start(simplePool());

    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(ar.getCurrentState().questionPool).not.toBeNull();
    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q1');
    }
  });

  test('start на не-intention анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());
    expect(() => ar.start(simplePool())).toThrow();
  });

  test('startNew создаёт анкету сразу в in_progress', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());

    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(ar.getCurrentState().questionPool).not.toBeNull();
    expect(ar.currentQuestionCode).toBe('q1');
  });

  // ── handleAction: одиночный выбор ──

  test('handleAction с одиночным выбором — фиксирует ответ и переходит дальше', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());

    const response = ar.handleAction({ type: 'callback', value: 'yes' });

    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q2');
    }

    const answers = ar.getAnswers();
    expect(answers.length).toBe(1);
    expect(answers[0]?.questionCode).toBe('q1');
    expect(answers[0]?.answerCode).toBe('yes');
    // answerText пустой — тексты извлекаются из pool при необходимости
    expect(answers[0]?.answerText).toBe('');
  });

  // ── handleAction: text ──

  test('handleAction с текстовым вопросом — фиксирует текст', () => {
    const pool: Question[] = [
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
    ];
    const ar = QuestionnaireAr.startNew(123, pool);

    const response = ar.handleAction({ type: 'text', value: 'Я разработчик' });

    expect(response.type).toBe('new_question');
    const answers = ar.getAnswers();
    expect(answers.length).toBe(1);
    expect(answers[0]?.answerCode).toBe('text');
    expect(answers[0]?.answerText).toBe('Я разработчик');
    expect(answers[0]?.questionCode).toBe('about');
  });

  // ── Завершение ──

  test('handleAction завершает анкету после последнего вопроса', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());

    ar.handleAction({ type: 'callback', value: 'yes' });
    const response = ar.handleAction({ type: 'callback', value: 'ok' });

    expect(response.type).toBe('completed');
    expect(ar.isCompleted()).toBe(true);
    expect(ar.getAnswers().length).toBe(2);
  });

  test('getCurrent на completed возвращает completed', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());
    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });

    expect(ar.getCurrent().type).toBe('completed');
  });

  // ── multiple choice ──

  test('handleAction с multiple choice — toggle черновиков', () => {
    const pool: Question[] = [
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
    ];
    const ar = QuestionnaireAr.startNew(123, pool);

    const r1 = ar.handleAction({ type: 'callback', value: 'a' });
    expect(r1.type).toBe('wait_next');
    if (r1.type === 'wait_next') {
      expect(r1.selectedAnswers).toEqual(['a']);
    }

    const r2 = ar.handleAction({ type: 'callback', value: 'b' });
    if (r2.type === 'wait_next') {
      expect(r2.selectedAnswers).toContain('a');
      expect(r2.selectedAnswers).toContain('b');
    }

    const r3 = ar.handleAction({ type: 'callback', value: 'a' });
    if (r3.type === 'wait_next') {
      expect(r3.selectedAnswers).toEqual(['b']);
    }

    const r4 = ar.handleAction({
      type: 'callback',
      value: QuestionnaireAr.getNextButtonText('mq'),
    });
    expect(r4.type).toBe('new_question');
    if (r4.type === 'new_question') {
      expect(r4.question.questionCode).toBe('last');
    }

    expect(ar.getAnswers().length).toBe(1);
    expect(ar.getAnswers()[0]?.answerCode).toBe('b');
  });

  // ── abandon ──

  test('abandon переводит анкету в abandoned', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());
    ar.abandon();
    expect(ar.getCurrentState().status).toBe('abandoned');
    ar.abandon(); // повторно не падает
  });

  test('abandon на completed — без эффекта', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());
    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });
    ar.abandon();
    expect(ar.getCurrentState().status).toBe('completed');
  });

  test('handleAction на завершённой анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());
    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });

    expect(() => ar.handleAction({ type: 'callback', value: 'ok' })).toThrow(
      'Анкета уже завершена',
    );
  });

  // ── getCurrent ──

  test('getCurrent возвращает текущий вопрос', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());
    const resp = ar.getCurrent();
    expect(resp.type).toBe('new_question');
    if (resp.type === 'new_question') {
      expect(resp.question.questionCode).toBe('q1');
    }
  });

  // ── Восстановление engine из сохранённого состояния ──

  test('конструктор восстанавливает engine из questionPool', () => {
    const ar = QuestionnaireAr.startNew(123, simplePool());
    const state = ar.getCurrentState();

    // Создаём новый агрегат из сохранённого состояния
    const restored = new QuestionnaireAr(state);
    expect(restored.getCurrent().type).toBe('new_question');

    // Можем продолжить отвечать
    const response = restored.handleAction({ type: 'callback', value: 'yes' });
    expect(response.type).toBe('new_question');
  });
});
