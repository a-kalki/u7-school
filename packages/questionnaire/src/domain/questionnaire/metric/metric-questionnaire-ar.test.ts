import { describe, expect, test } from 'bun:test';
import {
  type MetricQuestionnaire,
  MetricQuestionnaireAr,
} from './metric-questionnaire-ar';
import type { MetricQuestionPoolInput, MetricScore } from './metric-types';

const RESPONDENT_ID = '00000000-0000-0000-0000-000000000007';

function metricPool(
  questions: MetricQuestionPoolInput['questions'],
): MetricQuestionPoolInput {
  return { questions };
}

describe('MetricQuestionnaireAr', () => {
  test('завершение анкеты вычисляет metricScores по подкатегориям', () => {
    const pool = metricPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
        },
      },
      {
        questionCode: 'm2',
        question: 'Думает алгоритмами',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'algorithmic_thinking',
        },
      },
    ]);

    const ar = MetricQuestionnaireAr.createFromMetricPool(RESPONDENT_ID, pool);
    ar.start();

    ar.handleAction({ type: 'callback', value: '4' });
    const response = ar.handleAction({ type: 'callback', value: '2' });
    expect(response.type).toBe('completed');

    expect(ar.hasEvents()).toBe(true);
    const events = ar.flushEvents();
    expect(events.length).toBe(1);

    const payload = events[0]!.payload;
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
    expect(payload).not.toHaveProperty('answers');
  });

  test('разный вес вопросов даёт корректное средневзвешенное', () => {
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
          weight: 3,
        },
      },
    ]);

    const ar = MetricQuestionnaireAr.createFromMetricPool(RESPONDENT_ID, pool);
    ar.start();

    ar.handleAction({ type: 'callback', value: '5' });
    ar.handleAction({ type: 'callback', value: '1' });

    const events = ar.flushEvents();
    const scores = events[0]!.payload.metricScores as MetricScore[];
    // (5 * 1 + 1 * 3) / (1 + 3) = 8 / 4 = 2
    expect(scores).toEqual([
      { category: 'team_skills', subcategory: 'communication', score: 2 },
    ]);
  });

  test('без metricMapping metricScores — пустой массив', () => {
    const pool = metricPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
        },
      },
      {
        questionCode: 'm2',
        question: 'Думает алгоритмами',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'algorithmic_thinking',
        },
      },
    ]);

    const ar = MetricQuestionnaireAr.createFromMetricPool(RESPONDENT_ID, pool);

    // Восстанавливаем анкету из сохранённого состояния без metricMappings
    const plainState = {
      ...ar.state,
      metricMappings: {},
    } as MetricQuestionnaire;
    const restored = new MetricQuestionnaireAr(plainState);

    restored.start();
    restored.handleAction({ type: 'callback', value: '3' });
    const response = restored.handleAction({ type: 'callback', value: '3' });
    expect(response.type).toBe('completed');

    const events = restored.flushEvents();
    expect(events[0]!.payload.metricScores).toEqual([]);
  });

  test('MetricQuestion преобразуется в ChoiceQuestion со шкалой Лайкерта', () => {
    const pool = metricPool([
      {
        questionCode: 'm1',
        question: 'Пишет код чисто',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'work_quality',
        },
      },
      {
        questionCode: 'm2',
        question: 'Думает алгоритмами',
        metricMapping: {
          category: 'professional_skills',
          subcategory: 'algorithmic_thinking',
        },
      },
    ]);

    const ar = MetricQuestionnaireAr.createFromMetricPool(RESPONDENT_ID, pool);
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
