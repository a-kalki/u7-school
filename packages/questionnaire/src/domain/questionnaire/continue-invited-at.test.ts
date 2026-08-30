import { describe, expect, test } from 'bun:test';
import type { Questionnaire } from './entity';
import type { Question, QuestionnairePool } from './question';
import {
  QuestionnaireAr,
  type StandardQuestionnaireArMeta,
} from './standard/questionnaire-ar';

/**
 * continueInvitedAt — отметка «анкете отправлено приглашение продолжить»
 * (ступень 3ч планировщика брошенных анкет, spec FR-4).
 *
 * Аналог warnedAt: обходит safeUpdate — таймер простоя (updatedAt)
 * не сбрасывается; сбрасывается при активности пользователя.
 */

// ══ Помощники (конвенция warned-at.test.ts) ══

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

describe('continueInvitedAt (приглашение продолжить брошенную анкету)', () => {
  test('markContinueInvited() устанавливает continueInvitedAt, не сдвигая updatedAt', () => {
    const ar = makeInProgressAr();

    ar.markContinueInvited();

    const state = ar.state as StandardQuestionnaireArMeta['state'];
    expect(state.continueInvitedAt).toBeDefined();
    // Таймер простоя считается от updatedAt — приглашение не должно его сбрасывать
    expect(state.updatedAt).toBe('2024-01-01T00:00');
  });

  test('markContinueInvited() на не-активной анкете выбрасывает ошибку', () => {
    const invited = new QuestionnaireAr(makeState());
    expect(() => invited.markContinueInvited()).toThrow();

    const completed = makeInProgressAr();
    completed.handleAction({ type: 'callback', value: 'yes' });
    expect(() => completed.markContinueInvited()).toThrow();
  });

  test('handleAction() сбрасывает continueInvitedAt (возобновление сбрасывает цепочку)', () => {
    const ar = makeInProgressAr();
    ar.markContinueInvited();
    expect(
      (ar.state as StandardQuestionnaireArMeta['state']).continueInvitedAt,
    ).toBeDefined();

    ar.handleAction({ type: 'callback', value: 'yes' });

    const state = ar.state as StandardQuestionnaireArMeta['state'];
    expect(state.continueInvitedAt).toBeUndefined();
  });

  test('start() сбрасывает continueInvitedAt (если анкета была начата заново)', () => {
    const ar = new QuestionnaireAr(
      makeState({ continueInvitedAt: '2024-01-01T05:00' }),
    );

    ar.start();

    const state = ar.state as StandardQuestionnaireArMeta['state'];
    expect(state.status).toBe('in_progress');
    expect(state.continueInvitedAt).toBeUndefined();
  });

  test('warnedAt и continueInvitedAt независимы', () => {
    const ar = makeInProgressAr();

    ar.markWarned();
    ar.markContinueInvited();

    const state = ar.state as StandardQuestionnaireArMeta['state'];
    expect(state.warnedAt).toBeDefined();
    expect(state.continueInvitedAt).toBeDefined();
    expect(state.updatedAt).toBe('2024-01-01T00:00');
  });
});
