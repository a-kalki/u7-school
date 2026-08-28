import { describe, expect, test } from 'bun:test';
import type { Questionnaire } from './entity';
import type { Question, QuestionnairePool } from './question';
import {
  QuestionnaireAr,
  type StandardQuestionnaireArMeta,
} from './standard/questionnaire-ar';

// ══ Помощники ══

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
  ]);
}

function makeState(overrides: Partial<Questionnaire> = {}): Questionnaire {
  return {
    kind: 'standard',
    uuid: '00000000-0000-0000-0000-000000000042',
    respondentId: '00000000-0000-0000-0000-000000000007',
    status: 'invited',
    currentQuestionCode: null,
    draftAnswers: {},
    answers: [],
    questionPool: simplePool(),
    ownerInfo: {},
    createdAt: '2024-01-01T00:00',
    updatedAt: '2024-01-01T00:00',
    completedAt: null,
    ...overrides,
  };
}

/** AR в статусе in_progress на первом вопросе */
function makeInProgressAr(
  overrides: Partial<Questionnaire> = {},
): QuestionnaireAr {
  const state = makeState({
    status: 'in_progress',
    currentQuestionCode: 'q1',
    ...overrides,
  });
  return new QuestionnaireAr(state);
}

// ══ Тесты ══

describe('warnedAt (предупреждение о брошенной анкете)', () => {
  test('markWarned() устанавливает warnedAt, не сдвигая updatedAt', () => {
    const ar = makeInProgressAr();

    ar.markWarned();

    const state = ar.state as StandardQuestionnaireArMeta['state'];
    expect(state.warnedAt).toBeDefined();
    // Таймер простоя считается от updatedAt — предупреждение не должно его сбрасывать
    expect(state.updatedAt).toBe('2024-01-01T00:00');
  });

  test('markWarned() на не-активной анкете выбрасывает ошибку', () => {
    const invited = new QuestionnaireAr(makeState());
    expect(() => invited.markWarned()).toThrow();

    const completed = makeInProgressAr();
    completed.handleAction({ type: 'callback', value: 'yes' });
    expect(() => completed.markWarned()).toThrow();
  });

  test('start() сбрасывает warnedAt', () => {
    const ar = new QuestionnaireAr(makeState({ warnedAt: '2024-01-01T05:00' }));

    ar.start();

    const state = ar.state as StandardQuestionnaireArMeta['state'];
    expect(state.status).toBe('in_progress');
    expect(state.warnedAt).toBeUndefined();
  });

  test('handleAction() сбрасывает warnedAt (активность пользователя)', () => {
    const ar = makeInProgressAr();
    ar.markWarned();
    expect(
      (ar.state as StandardQuestionnaireArMeta['state']).warnedAt,
    ).toBeDefined();

    ar.handleAction({ type: 'callback', value: 'yes' });

    const state = ar.state as StandardQuestionnaireArMeta['state'];
    expect(state.warnedAt).toBeUndefined();
  });
});
