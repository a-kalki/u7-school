import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import { QuestionnaireAr } from '../a-root';
import { QuestionnaireSchema } from '../entity';
import type { ChoiceQuestion } from '../question';
import { QuestionnaireEngine } from '../questionnaire-engine';
import {
  LIKERT_SCALE,
  type MetricMapping,
  type MetricQuestion,
  type MetricQuestionPool,
  MetricQuestionPoolSchema,
  type MetricScore,
  MetricScoreSchema,
} from './metric-types';

/** Состояние метрик-анкеты: упрощённый пул (MetricQuestion[]) вместо полного Question[]. */
export const MetricQuestionnaireSchema = v.object({
  ...QuestionnaireSchema.entries,
  questionPool: MetricQuestionPoolSchema,
});
export type MetricQuestionnaire = v.InferOutput<
  typeof MetricQuestionnaireSchema
>;

/** Агрегат метрик-анкеты: расширяет payload события завершения полем metricScores. */
export class MetricQuestionnaireAr extends QuestionnaireAr<MetricQuestionnaire> {
  constructor(state: MetricQuestionnaire) {
    super(
      state,
      MetricQuestionnaireSchema as unknown as v.GenericSchema<MetricQuestionnaire>,
    );
  }

  /**
   * Создаёт метрик-анкету из пула метрик.
   * Вопросы хранятся в упрощённом виде (MetricQuestion),
   * движок получает полный Question[] через buildEngine.
   */
  static createFromMetricPool(
    respondentId: string,
    pool: MetricQuestionPool,
  ): MetricQuestionnaireAr {
    const parsed = v.parse(MetricQuestionPoolSchema, pool);

    const state: MetricQuestionnaire = {
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'invited',
      currentQuestionCode: null,
      draftAnswers: {},
      answers: [],
      questionPool: parsed,
      createdAt: isoNow(),
      completedAt: null,
    };

    return new MetricQuestionnaireAr(state);
  }

  protected override buildEngine(
    state: MetricQuestionnaire,
  ): QuestionnaireEngine {
    return new QuestionnaireEngine(
      state.questionPool.questions.map((q) => this.toChoiceQuestion(q)),
    );
  }

  /** Преобразует компактный MetricQuestion в полный ChoiceQuestion для движка. */
  private toChoiceQuestion(mq: MetricQuestion): ChoiceQuestion {
    return {
      questionCode: mq.questionCode,
      question: mq.question,
      type: 'choice',
      multiple: false,
      answers: [...LIKERT_SCALE],
    };
  }

  protected override buildCompletionPayload(): Record<string, unknown> {
    return {
      ...super.buildCompletionPayload(),
      metricScores: this.computeMetricScores(),
    };
  }

  /**
   * Вычисляет баллы по подкатегориям как средневзвешенное:
   * Σ(answer × weight) / Σ(weight).
   */
  private computeMetricScores(): MetricScore[] {
    type Acc = {
      category: MetricMapping['category'];
      subcategory: MetricMapping['subcategory'];
      weightedSum: number;
      weightSum: number;
    };

    const byCode = new Map<string, MetricMapping>();
    for (const question of this.state.questionPool.questions) {
      byCode.set(question.questionCode, question.metricMapping);
    }

    const groups = new Map<string, Acc>();

    for (const answer of this.state.answers) {
      const mapping = byCode.get(answer.questionCode);
      if (!mapping) continue;

      const numeric = Number(answer.answerCode);
      if (!Number.isFinite(numeric)) continue;

      const key = `${mapping.category}:${mapping.subcategory}`;
      const acc = groups.get(key) ?? {
        category: mapping.category,
        subcategory: mapping.subcategory,
        weightedSum: 0,
        weightSum: 0,
      };
      acc.weightedSum += numeric * mapping.weight;
      acc.weightSum += mapping.weight;
      groups.set(key, acc);
    }

    const raw: Array<{
      category: MetricMapping['category'];
      subcategory: MetricMapping['subcategory'];
      score: number;
    }> = [];
    for (const acc of groups.values()) {
      if (acc.weightSum <= 0) continue;
      raw.push({
        category: acc.category,
        subcategory: acc.subcategory,
        score: acc.weightedSum / acc.weightSum,
      });
    }

    return v.parse(v.array(MetricScoreSchema), raw);
  }
}
