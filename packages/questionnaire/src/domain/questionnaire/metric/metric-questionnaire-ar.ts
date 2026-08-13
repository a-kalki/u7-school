import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import { QuestionnaireAr } from '../a-root';
import { QuestionnaireSchema } from '../entity';
import type { Question } from '../question';
import {
  type MetricMapping,
  MetricMappingSchema,
  type MetricQuestionPoolInput,
  MetricQuestionPoolSchema,
  type MetricScore,
  MetricScoreSchema,
  toChoiceQuestion,
} from './metric-types';

/** Состояние метрик-анкеты: обычная анкета + metricMappings по кодам вопросов */
export const MetricQuestionnaireSchema = v.object({
  ...QuestionnaireSchema.entries,
  metricMappings: v.record(v.string(), MetricMappingSchema),
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
   * Вопросы преобразуются в обычные ChoiceQuestion (движок не знает о метриках),
   * metricMapping сохраняется в state.metricMappings.
   */
  static createFromMetricPool(
    respondentId: string,
    pool: MetricQuestionPoolInput,
  ): MetricQuestionnaireAr {
    const parsed = v.parse(MetricQuestionPoolSchema, pool);

    const metricMappings: Record<string, MetricMapping> = {};
    const questions: Question[] = parsed.questions.map((mq) => {
      metricMappings[mq.questionCode] = mq.metricMapping;
      return toChoiceQuestion(mq);
    });

    const state: MetricQuestionnaire = {
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'invited',
      currentQuestionCode: null,
      draftAnswers: {},
      answers: [],
      questionPool: {
        inviteText: parsed.inviteText,
        whyText: parsed.whyText,
        completionText: parsed.completionText,
        cancelWarning: parsed.cancelWarning,
        questions,
      },
      createdAt: isoNow(),
      completedAt: null,
      metricMappings,
    };

    return new MetricQuestionnaireAr(state);
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

    const groups = new Map<string, Acc>();

    for (const answer of this.state.answers) {
      const mapping = this.state.metricMappings[answer.questionCode];
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
