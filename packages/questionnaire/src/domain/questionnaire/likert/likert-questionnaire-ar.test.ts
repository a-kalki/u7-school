import { describe, expect, test } from 'bun:test';
import type { LikertQuestionnaireCompleteEvent } from '../events';
import { QuestionnaireFactory } from '../questionnaire-factory';
import type { LikertQuestionPool } from './likert-question';
import type { LikertQuestionnaireAr } from './likert-questionnaire-ar';

const RESPONDENT_ID = '00000000-0000-0000-0000-000000000007';
const SUBJECT_ID = '00000000-0000-0000-0000-000000000008';

function likertPool(
  questions: LikertQuestionPool['questions'],
): LikertQuestionPool {
  return { questions };
}

function ownerInfo() {
  return {
    context: 'module_completed',
    role: 'student_student',
    subjectId: SUBJECT_ID,
    triggerEvent: {
      type: 'module_completed',
      aggregateId: '00000000-0000-0000-0000-000000000009',
    },
  };
}

/** Достаёт событие завершения из событий агрегата (сужает union по eventName). */
function completedEvent(
  ar: LikertQuestionnaireAr,
): LikertQuestionnaireCompleteEvent {
  const event = ar.flushEvents()[0];
  if (!event || event.eventName !== 'questionnaire:likert-complete') {
    throw new Error('Ожидалось событие questionnaire:likert-complete');
  }
  return event;
}

describe('LikertQuestionnaireAr', () => {
  test('завершение анкеты вычисляет likertScores и кладёт ownerInfo в событие', () => {
    const pool = likertPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        likertMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
          weight: 1,
        },
      },
      {
        questionCode: 'm2',
        question: 'Думает алгоритмами',
        likertMapping: {
          category: 'professional_skills',
          subcategory: 'algorithmic_thinking',
          weight: 1,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createLikert(
      RESPONDENT_ID,
      pool,
      ownerInfo(),
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: '4' });
    const response = ar.handleAction({ type: 'callback', value: '2' });
    expect(response.type).toBe('completed');

    expect(ar.hasEvents()).toBe(true);
    const event = completedEvent(ar);
    const payload = event.payload;
    expect(payload.likertScores).toEqual([
      {
        category: 'professional_skills',
        subcategory: 'work_quality',
        score: 4,
      },
      {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        score: 2,
      },
    ]);
    expect(payload).toHaveProperty('questionnaireId');
    expect(payload).toHaveProperty('respondentId');
    expect(event.ownerInfo).toEqual(ownerInfo());
    expect(payload).not.toHaveProperty('answers');
  });

  test('ownerInfo без triggerEvent сохраняется как есть', () => {
    const pool = likertPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        likertMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
          weight: 1,
        },
      },
    ]);

    const info = {
      context: 'pair_programming',
      role: 'student_student',
      subjectId: SUBJECT_ID,
    };
    const ar = QuestionnaireFactory.createLikert(RESPONDENT_ID, pool, info);
    ar.start();
    ar.handleAction({ type: 'callback', value: '3' });

    const event = completedEvent(ar);
    expect(event.ownerInfo).toEqual(info);
  });

  test('разный вес вопросов даёт корректное средневзвешенное', () => {
    const pool = likertPool([
      {
        questionCode: 'a',
        question: 'Общается',
        likertMapping: {
          category: 'team_skills',
          subcategory: 'communication',
          weight: 0.75,
        },
      },
      {
        questionCode: 'b',
        question: 'Помогает',
        likertMapping: {
          category: 'team_skills',
          subcategory: 'communication',
          weight: 1.25,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createLikert(
      RESPONDENT_ID,
      pool,
      ownerInfo(),
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: '5' });
    ar.handleAction({ type: 'callback', value: '1' });

    const scores = completedEvent(ar).payload.likertScores;
    // (5 * 0.75 + 1 * 1.25) / (0.75 + 1.25) = 5 / 2 = 2.5
    expect(scores).toEqual([
      { category: 'team_skills', subcategory: 'communication', score: 2.5 },
    ]);
  });

  test('несколько вопросов одной подкатегории — среднее при weight=1', () => {
    const pool = likertPool([
      {
        questionCode: 'a',
        question: 'Общается',
        likertMapping: {
          category: 'team_skills',
          subcategory: 'communication',
          weight: 1,
        },
      },
      {
        questionCode: 'b',
        question: 'Помогает',
        likertMapping: {
          category: 'team_skills',
          subcategory: 'communication',
          weight: 1,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createLikert(
      RESPONDENT_ID,
      pool,
      ownerInfo(),
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: '4' });
    const response = ar.handleAction({ type: 'callback', value: '2' });
    expect(response.type).toBe('completed');

    const scores = completedEvent(ar).payload.likertScores;
    // (4 + 2) / 2 = 3
    expect(scores).toEqual([
      { category: 'team_skills', subcategory: 'communication', score: 3 },
    ]);
  });

  test('LikertQuestion преобразуется в ChoiceQuestion со шкалой Лайкерта', () => {
    const pool = likertPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        likertMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
          weight: 1,
        },
      },
      {
        questionCode: 'm2',
        question: 'Думает алгоритмами',
        likertMapping: {
          category: 'professional_skills',
          subcategory: 'algorithmic_thinking',
          weight: 1,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createLikert(
      RESPONDENT_ID,
      pool,
      ownerInfo(),
    );
    const response = ar.start();

    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.type).toBe('choice');
      if (response.question.type === 'choice') {
        expect(response.question.multiple).toBe(false);
        expect(response.question.answers.length).toBe(5);
        expect(response.question.answers[0]?.answerCode).toBe('1');
        expect(response.question.answers[4]?.answerCode).toBe('5');
      }
    }
  });
});
