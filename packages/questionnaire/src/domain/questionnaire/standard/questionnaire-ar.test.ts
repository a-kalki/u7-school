import { describe, expect, test } from 'bun:test';
import type { Question, QuestionnairePool } from '../question';
import { QuestionnaireFactory } from '../questionnaire-factory';
import { QuestionnaireAr } from './questionnaire-ar';

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
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      pool,
    );

    expect(ar.state.respondentId).toBe('00000000-0000-0000-0000-000000000007');
    expect(ar.state.status).toBe('invited');
    expect(ar.state.questionPool).not.toBeNull();
    expect(ar.state.answers).toEqual([]);
  });

  // ── createInvite ──

  test('createInvite возвращает InviteResponse с inviteText и whyText', () => {
    const pool = simplePool();
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      pool,
    );

    const invite = ar.getInvite();
    expect(invite.type).toBe('invited');
    expect(invite.questionnaireId).toBe(ar.state.uuid);
    expect(invite.inviteText).toBe('Приглашаем пройти опрос');
    expect(invite.whyText).toBe('Это улучшит твои метрики');
  });

  test('getQuestionnaireActionResponse на invited возвращает InviteResponse', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    const resp = ar.getQuestionnaireActionResponse();
    expect(resp.type).toBe('invited');
  });

  // ── decline ──

  test('decline переводит invited → abandoned', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.decline();
    expect(ar.state.status).toBe('abandoned');
  });

  test('decline на не-invited анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();
    expect(() => ar.decline()).toThrow();
  });

  // ── start без параметров ──

  test('start переводит invited → in_progress и выдаёт первый вопрос из пула', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    const response = ar.start();

    expect(ar.state.status).toBe('in_progress');
    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q1');
    }
  });

  test('start на не-invited анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start(); // OK
    expect(() => ar.start()).toThrow(); // уже in_progress
  });

  test('start на declined анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.decline();
    expect(() => ar.start()).toThrow();
  });

  // ── handleAction: одиночный выбор ──

  test('handleAction с одиночным выбором — фиксирует ответ и переходит дальше', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();

    const response = ar.handleAction({ type: 'callback', value: 'yes' });

    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q2');
    }

    const answers = ar.state.answers;
    expect(answers.length).toBe(1);
    expect(answers[0]?.questionCode).toBe('q1');
    expect(answers[0]?.answerCode).toBe('yes');
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
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      pool,
    );
    ar.start();

    const response = ar.handleAction({ type: 'text', value: 'Я разработчик' });

    expect(response.type).toBe('new_question');
    const answers = ar.state.answers;
    expect(answers.length).toBe(1);
    expect(answers[0]?.answerCode).toBe('text');
    expect(answers[0]?.answerText).toBe('Я разработчик');
  });

  // ── Завершение ──

  test('handleAction завершает анкету после последнего вопроса', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: 'yes' });
    const response = ar.handleAction({ type: 'callback', value: 'ok' });

    expect(response.type).toBe('completed');
    expect(ar.state.answers.length).toBe(2);
  });

  test('handleAction при завершении возвращает completionText из пула', () => {
    const pool = {
      ...simplePool(),
      completionText: 'Спасибо! Анкета принята, желание закреплено.',
    };
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      pool,
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: 'yes' });
    const response = ar.handleAction({ type: 'callback', value: 'ok' });
    if (response.type !== 'completed') {
      throw new Error(`Ожидался completed, получен ${response.type}`);
    }

    expect(response.completionText).toBe(
      'Спасибо! Анкета принята, желание закреплено.',
    );
  });

  test('getQuestionnaireActionResponse на completed возвращает completed', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
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
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      pool,
    );
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

    expect(ar.state.answers.length).toBe(1);
    expect(ar.state.answers[0]?.answerCode).toBe('b');
  });

  // ── abandon ──

  test('abandon переводит анкету в abandoned', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();
    ar.abandon();
    expect(ar.state.status).toBe('abandoned');
    ar.abandon(); // повторно не падает
  });

  test("abandon('by_user') персистит reason в состоянии и событии", () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();

    ar.abandon('by_user');

    expect(ar.state.status).toBe('abandoned');
    expect(ar.state.abandonReason).toBe('by_user');

    const events = ar.flushEvents();
    expect(events.length).toBe(1);
    const event = events[0]!;
    if (event.eventName !== 'questionnaire:abandon') {
      throw new Error('ожидалось событие questionnaire:abandon');
    }
    expect(event.payload.reason).toBe('by_user');
  });

  test("abandon('timeout') персистит reason в состоянии и событии", () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();

    ar.abandon('timeout');

    expect(ar.state.status).toBe('abandoned');
    expect(ar.state.abandonReason).toBe('timeout');

    const events = ar.flushEvents();
    const event = events[0]!;
    if (event.eventName !== 'questionnaire:abandon') {
      throw new Error('ожидалось событие questionnaire:abandon');
    }
    expect(event.payload.reason).toBe('timeout');
  });

  test('abandon() без reason — abandonReason не установлен', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();

    ar.abandon();

    expect(ar.state.status).toBe('abandoned');
    expect(ar.state.abandonReason).toBeUndefined();
  });

  test('abandon на completed — выбрасывает ошибку', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();
    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });
    expect(() => ar.abandon()).toThrow('Анкета не активна');
  });

  test('handleAction на завершённой анкете выбрасывает ошибку', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();
    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });

    expect(() => ar.handleAction({ type: 'callback', value: 'ok' })).toThrow(
      'Анкета уже завершена',
    );
  });

  // ── getQuestionnaireActionResponse ──

  test('getQuestionnaireActionResponse возвращает текущий вопрос', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();
    const resp = ar.getQuestionnaireActionResponse();
    expect(resp.type).toBe('new_question');
    if (resp.type === 'new_question') {
      expect(resp.question.questionCode).toBe('q1');
    }
  });

  // ── Восстановление engine из сохранённого состояния ──

  test('конструктор восстанавливает engine из questionPool', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();

    // Создаём новый агрегат из сохранённого состояния
    const restored = new QuestionnaireAr(ar.state);
    expect(restored.getQuestionnaireActionResponse().type).toBe('new_question');

    // Можем продолжить отвечать
    const response = restored.handleAction({ type: 'callback', value: 'yes' });
    expect(response.type).toBe('new_question');
  });

  // ── getQuestionnaireActionResponse для abandoned ──

  test('getQuestionnaireActionResponse на abandoned возвращает completed', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();
    ar.abandon();
    expect(ar.getQuestionnaireActionResponse().type).toBe('completed');
  });

  // ── Событие завершения ──

  test('завершение анкеты генерирует событие questionnaire.completed без answers', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: 'yes' });
    ar.handleAction({ type: 'callback', value: 'ok' });

    expect(ar.hasEvents()).toBe(true);
    const events = ar.flushEvents();
    expect(events.length).toBe(1);
    const event = events[0]!;
    expect(event.eventName).toBe('questionnaire:complete');
    expect(event.aggregateName).toBe('Questionnaire');
    expect(event.aggregateId).toBe(ar.state.uuid);
    expect(event.payload).toEqual({
      questionnaireId: ar.state.uuid,
      respondentId: '00000000-0000-0000-0000-000000000007',
    });
    expect(event.ownerInfo).toEqual({});
    expect(event.payload).not.toHaveProperty('answers');
  });

  // ── События при отказе/прерывании ──

  test('decline генерирует событие declined', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.decline();
    expect(ar.hasEvents()).toBe(true);
    const events = ar.flushEvents();
    expect(events.length).toBe(1);
    expect(events[0]!.eventName).toBe('questionnaire:decline');
    expect(events[0]!.payload).toEqual({
      questionnaireId: ar.state.uuid,
      respondentId: '00000000-0000-0000-0000-000000000007',
    });
  });

  test('abandon генерирует событие abandoned', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      simplePool(),
    );
    ar.start();
    ar.abandon();
    expect(ar.hasEvents()).toBe(true);
    const events = ar.flushEvents();
    expect(events.length).toBe(1);
    expect(events[0]!.eventName).toBe('questionnaire:abandon');
    expect(events[0]!.payload).toEqual({
      questionnaireId: ar.state.uuid,
      respondentId: '00000000-0000-0000-0000-000000000007',
    });
  });
});

describe('QuestionnaireAr — прогресс в ответах', () => {
  function progressPool(): QuestionnairePool {
    return makePool([
      {
        question: 'Мультивыбор',
        questionCode: 'm1',
        type: 'choice',
        multiple: true,
        answers: [
          { answer: 'А', answerCode: 'a' },
          { answer: 'Б', answerCode: 'b' },
        ],
      },
      {
        question: 'Финал',
        questionCode: 'f1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'OK', answerCode: 'ok' }],
      },
    ]);
  }

  test('wait_next несёт questionIndex и poolSize', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      progressPool(),
    );
    ar.start();

    const draft = ar.handleAction({ type: 'callback', value: 'a' });
    if (draft.type !== 'wait_next') {
      throw new Error(`Ожидался wait_next, получен ${draft.type}`);
    }

    expect(draft.questionIndex).toBe(1);
    expect(draft.poolSize).toBe(2);
  });

  test('new_question несёт questionIndex следующего вопроса и poolSize', () => {
    const ar = QuestionnaireFactory.createStandard(
      '00000000-0000-0000-0000-000000000007',
      progressPool(),
    );
    ar.start();
    ar.handleAction({ type: 'callback', value: 'a' });

    const next = ar.handleAction({ type: 'callback', value: 'next:m1' });
    if (next.type !== 'new_question') {
      throw new Error(`Ожидался new_question, получен ${next.type}`);
    }

    expect(next.questionIndex).toBe(2);
    expect(next.poolSize).toBe(2);
  });
});
