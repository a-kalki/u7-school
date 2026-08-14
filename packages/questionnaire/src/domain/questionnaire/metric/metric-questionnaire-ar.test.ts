import { describe, expect, test } from 'bun:test';
import type { MetricQuestionnaireCompleted } from '../events';
import { QuestionnaireFactory } from '../questionnaire-factory';
import type { MetricQuestionPool } from './metric-question';
import type { MetricAssessment } from './metric-questionnaire';
import type { MetricQuestionnaireAr } from './metric-questionnaire-ar';

const RESPONDENT_ID = '00000000-0000-0000-0000-000000000007';
const SUBJECT_ID = '00000000-0000-0000-0000-000000000008';

function metricPool(
  questions: MetricQuestionPool['questions'],
): MetricQuestionPool {
  return { questions };
}

function assessment(): MetricAssessment {
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
  ar: MetricQuestionnaireAr,
): MetricQuestionnaireCompleted {
  const event = ar.flushEvents()[0];
  if (!event || event.eventName !== 'questionnaire.completed') {
    throw new Error('Ожидалось событие questionnaire.completed');
  }
  return event;
}

describe('MetricQuestionnaireAr', () => {
  test('завершение анкеты вычисляет metricScores и кладёт assessment в событие', () => {
    const pool = metricPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
          weight: 1,
        },
      },
      {
        questionCode: 'm2',
        question: 'Думает алгоритмами',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'algorithmic_thinking',
          weight: 1,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createMetric(
      RESPONDENT_ID,
      pool,
      assessment(),
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: '4' });
    const response = ar.handleAction({ type: 'callback', value: '2' });
    expect(response.type).toBe('completed');

    expect(ar.hasEvents()).toBe(true);
    const event = completedEvent(ar);
    const payload = event.payload;
    expect(payload.metricScores).toEqual([
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
    expect(payload.context).toBe('module_completed');
    expect(payload.role).toBe('student_student');
    expect(payload.subjectId).toBe(SUBJECT_ID);
    expect(payload.triggerEvent).toEqual({
      type: 'module_completed',
      aggregateId: '00000000-0000-0000-0000-000000000009',
    });
    expect(payload).not.toHaveProperty('answers');
  });

  test('без triggerEvent — поле отсутствует в событии', () => {
    const pool = metricPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
          weight: 1,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createMetric(RESPONDENT_ID, pool, {
      context: 'pair_programming',
      role: 'student_student',
      subjectId: SUBJECT_ID,
    });
    ar.start();
    ar.handleAction({ type: 'callback', value: '3' });

    const payload = completedEvent(ar).payload;
    expect(payload.triggerEvent).toBeUndefined();
    expect(payload.context).toBe('pair_programming');
    expect(payload.role).toBe('student_student');
    expect(payload.subjectId).toBe(SUBJECT_ID);
  });

  test('разный вес вопросов даёт корректное средневзвешенное', () => {
    const pool = metricPool([
      {
        questionCode: 'a',
        question: 'Общается',
        metricMapping: {
          category: 'team_skills',
          subcategory: 'communication',
          weight: 0.75,
        },
      },
      {
        questionCode: 'b',
        question: 'Помогает',
        metricMapping: {
          category: 'team_skills',
          subcategory: 'communication',
          weight: 1.25,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createMetric(
      RESPONDENT_ID,
      pool,
      assessment(),
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: '5' });
    ar.handleAction({ type: 'callback', value: '1' });

    const scores = completedEvent(ar).payload.metricScores;
    // (5 * 0.75 + 1 * 1.25) / (0.75 + 1.25) = 5 / 2 = 2.5
    expect(scores).toEqual([
      { category: 'team_skills', subcategory: 'communication', score: 2.5 },
    ]);
  });

  test('несколько вопросов одной подкатегории — среднее при weight=1', () => {
    const pool = metricPool([
      {
        questionCode: 'a',
        question: 'Общается',
        metricMapping: {
          category: 'team_skills',
          subcategory: 'communication',
          weight: 1,
        },
      },
      {
        questionCode: 'b',
        question: 'Помогает',
        metricMapping: {
          category: 'team_skills',
          subcategory: 'communication',
          weight: 1,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createMetric(
      RESPONDENT_ID,
      pool,
      assessment(),
    );
    ar.start();

    ar.handleAction({ type: 'callback', value: '4' });
    const response = ar.handleAction({ type: 'callback', value: '2' });
    expect(response.type).toBe('completed');

    const scores = completedEvent(ar).payload.metricScores;
    // (4 + 2) / 2 = 3
    expect(scores).toEqual([
      { category: 'team_skills', subcategory: 'communication', score: 3 },
    ]);
  });

  test('MetricQuestion преобразуется в ChoiceQuestion со шкалой Лайкерта', () => {
    const pool = metricPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
          weight: 1,
        },
      },
      {
        questionCode: 'm2',
        question: 'Думает алгоритмами',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'algorithmic_thinking',
          weight: 1,
        },
      },
    ]);

    const ar = QuestionnaireFactory.createMetric(
      RESPONDENT_ID,
      pool,
      assessment(),
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
