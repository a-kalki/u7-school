import { describe, expect, test } from 'bun:test';
import type { LikertQuestionPool } from './likert/likert-question';
import type { QuestionnairePool } from './question';
import { QuestionnaireFactory } from './questionnaire-factory';

const RESPONDENT_ID = '00000000-0000-0000-0000-000000000007';

function standardPool(): QuestionnairePool {
  return {
    inviteText: 'Приглашение',
    questions: [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice' as const,
        multiple: false,
        answers: [{ answer: 'A', answerCode: 'a' }],
      },
    ],
  };
}

function likertPool(): LikertQuestionPool {
  return {
    questions: [
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        likertMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
          weight: 1,
        },
      },
    ],
  };
}

describe('QuestionnaireFactory ownerInfo', () => {
  test('createStandard сохраняет ownerInfo в состоянии', () => {
    const ar = QuestionnaireFactory.createStandard(
      RESPONDENT_ID,
      standardPool(),
      { wishId: 'w1', reason: 'wants_to_learn' },
    );

    expect(ar.state.ownerInfo).toEqual({
      wishId: 'w1',
      reason: 'wants_to_learn',
    });
  });

  test('createStandard без ownerInfo использует {}', () => {
    const ar = QuestionnaireFactory.createStandard(
      RESPONDENT_ID,
      standardPool(),
    );

    expect(ar.state.ownerInfo).toEqual({});
  });

  test('createLikert сохраняет ownerInfo и не хранит assessment', () => {
    const ownerInfo = {
      context: 'module_completed',
      role: 'student_student',
      subjectId: '00000000-0000-0000-0000-000000000008',
    };
    const ar = QuestionnaireFactory.createLikert(
      RESPONDENT_ID,
      likertPool(),
      ownerInfo,
    );

    expect(ar.state.ownerInfo).toEqual(ownerInfo);
    expect(ar.state.kind).toBe('likert');
    expect('assessment' in ar.state).toBe(false);
  });

  test('createLikert без ownerInfo использует {}', () => {
    const ar = QuestionnaireFactory.createLikert(RESPONDENT_ID, likertPool());

    expect(ar.state.ownerInfo).toEqual({});
  });
});
