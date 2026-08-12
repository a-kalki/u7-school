import { describe, expect, test } from 'bun:test';
import { QuestionnaireAr } from './a-root';
import type { Question, QuestionnairePool } from './question';

function makePool(questions: Question[]): QuestionnairePool {
  return {
    inviteText: 'Приглашаем пройти опрос',
    whyText: 'Это улучшит твои метрики',
    questions,
  };
}

function simplePool(): QuestionnairePool {
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

describe('QuestionnaireAr (v2)', () => {
  // ── create ──

  test('create создаёт анкету в статусе invited с сохранённым пулом', () => {
    const pool = simplePool();
    const ar = QuestionnaireAr.create(123, pool);

    expect(ar.getRespondentId()).toBe(123);
    expect(ar.getCurrentState().status).toBe('invited');
    expect(ar.getCurrentState().questionPool).not.toBeNull();
    expect(ar.getAnswers()).toEqual([]);
  });

  // ── createInvite ──

  test('createInvite возвращает InviteResponse с inviteText и whyText', () => {
    const pool = simplePool();
    const ar = QuestionnaireAr.create(123, pool);

    const invite = ar.createInvite();
    expect(invite.type).toBe('invited');
    expect(invite.questionnaireId).toBe(ar.getCurrentState().uuid);
    expect(invite.inviteText).toBe('Приглашаем пройти опрос');
    expect(invite.whyText).toBe('Это улучшит твои метрики');
  });

  test('getQuestionnaireActionResponse на invited возвращает InviteResponse', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    const resp = ar.getQuestionnaireActionResponse();
    expect(resp.type).toBe('invited');
  });

  // ── decline ──

  test('decline переводит invited → abandoned', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.decline();
    expect(ar.getCurrentState().status).toBe('abandoned');
  });

  test('decline на не-invited анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();
    expect(() => ar.decline()).toThrow();
  });

  // ── start без параметров ──

  test('start переводит invited → in_progress и выдаёт первый вопрос из пула', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    const response = ar.start();

    expect(ar.getCurrentState().status).toBe('in_progress');
    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q1');
    }
  });

  test('start на не-invited анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start(); // OK
    expect(() => ar.start()).toThrow(); // уже in_progress
  });

  test('start на declined анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.decline();
    expect(() => ar.start()).toThrow();
  });

  // ── handleAction: одиночный выбор ──

  test('handleAction с одиночным выбором — фиксирует ответ и переходит дальше', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();

    const response = ar.handleAction({ type: 'callback', value: 'yes' });

    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q2');
    }

    const answers = ar.getAnswers();
    expect(answers.length).toBe(1);
    expect(answers[0]?.questionCode).toBe('q1');
    expect(answers[0]?.answerCode).toBe('yes');
    expect(ar.getAnswerText('q1', 'yes')).toBe('Да');
  });

  // ── handleAction: text ──

  test('handleAction с текстовым вопросом — фиксирует текст', () => {
    const pool = makePool([
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
    const ar = QuestionnaireAr.create(123, pool);
    ar.start();

    const response = ar.handleAction({ type: 'text', value: 'Я разработчик' });

    expect(response.type).toBe('new_question');
    const answers = ar.getAnswers();
    expect(answers.length).toBe(1);
    expect(answers[0]?.answerCode).toBe('text');
    expect(answers[0]?.answerText).toBe('Я разработчик');
  });

  // ── Завершение ──

  test('handleAction завершает анкету после последнего вопроса', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();

    ar.handleAction({ type: 'callback', value: 'yes' });
    const response = ar.handleAction({ type: 'callback', value: 'ok' });

    expect(response.type).toBe('completed');
    expect(ar.isCompleted()).toBe(true);
    expect(ar.getAnswers().length).toBe(2);
  });

  test('getQuestionnaireActionResponse на completed возвращает completed', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();
    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });

    expect(ar.getQuestionnaireActionResponse().type).toBe('completed');
  });

  // ── multiple choice ──

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
    const ar = QuestionnaireAr.create(123, pool);
    ar.start();

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
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();
    ar.abandon();
    expect(ar.getCurrentState().status).toBe('abandoned');
    ar.abandon(); // повторно не падает
  });

  test('abandon на completed — без эффекта', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();
    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });
    ar.abandon();
    expect(ar.getCurrentState().status).toBe('completed');
  });

  test('handleAction на завершённой анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();
    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });

    expect(() => ar.handleAction({ type: 'callback', value: 'ok' })).toThrow(
      'Анкета уже завершена',
    );
  });

  // ── getQuestionnaireActionResponse ──

  test('getQuestionnaireActionResponse возвращает текущий вопрос', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();
    const resp = ar.getQuestionnaireActionResponse();
    expect(resp.type).toBe('new_question');
    if (resp.type === 'new_question') {
      expect(resp.question.questionCode).toBe('q1');
    }
  });

  // ── Восстановление engine из сохранённого состояния ──

  test('конструктор восстанавливает engine из questionPool', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();
    const state = ar.getCurrentState();

    // Создаём новый агрегат из сохранённого состояния
    const restored = new QuestionnaireAr(state);
    expect(restored.getQuestionnaireActionResponse().type).toBe('new_question');

    // Можем продолжить отвечать
    const response = restored.handleAction({ type: 'callback', value: 'yes' });
    expect(response.type).toBe('new_question');
  });

  // ── getQuestionnaireActionResponse для abandoned ──

  test('getQuestionnaireActionResponse на abandoned возвращает completed', () => {
    const ar = QuestionnaireAr.create(123, simplePool());
    ar.start();
    ar.abandon();
    expect(ar.getQuestionnaireActionResponse().type).toBe('completed');
  });
});
