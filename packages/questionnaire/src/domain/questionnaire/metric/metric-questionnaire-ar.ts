import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import { BaseQuestionnaireAr } from '../a-root';
import type { BaseQuestionnaireArMeta } from '../entity';
import type {
  MetricQuestionnaireAbandoned,
  MetricQuestionnaireCompleted,
  MetricQuestionnaireDeclined,
} from '../events';
import type { ChoiceQuestion } from '../question';
import { QuestionnaireEngine } from '../questionnaire-engine';
import {
  LIKERT_SCALE,
  type MetricMapping,
  type MetricQuestion,
  type MetricScore,
  MetricScoreSchema,
} from './metric-question';
import {
  type MetricAssessment,
  type MetricQuestionnaire,
  MetricQuestionnaireSchema,
} from './metric-questionnaire';

export interface MetricQuestionnaireArMeta extends BaseQuestionnaireArMeta {
  state: MetricQuestionnaire;
  events:
    | MetricQuestionnaireCompleted
    | MetricQuestionnaireDeclined
    | MetricQuestionnaireAbandoned;
}

/** Агрегат метрик-анкеты: публикует события завершения/отказа/прерывания. */
export class MetricQuestionnaireAr extends BaseQuestionnaireAr<MetricQuestionnaireArMeta> {
  constructor(state: MetricQuestionnaire) {
    super(state, MetricQuestionnaireSchema);
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

  /** Раскладывает оценочный контекст (triggerEvent — только если задан). */
  private assessmentFields(): MetricAssessment {
    const { context, role, subjectId, triggerEvent } = this.state.assessment;
    return triggerEvent
      ? { context, role, subjectId, triggerEvent }
      : { context, role, subjectId };
  }

  /** Общие поля event. */
  private baseEvent() {
    return {
      eventId: crypto.randomUUID(),
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire' as const,
      aggregateId: this.state.uuid,
    };
  }

  /** Общие поля payload событий метрик-анкеты (без metricScores). */
  private basePayload() {
    return {
      questionnaireId: this.state.uuid,
      respondentId: this.state.respondentId,
      ...this.assessmentFields(),
    };
  }

  protected buildCompletedEvent(): MetricQuestionnaireCompleted {
    return {
      ...this.baseEvent(),
      eventName: 'questionnaire.completed',
      payload: {
        ...this.basePayload(),
        metricScores: this.computeMetricScores(),
      },
    };
  }

  protected buildDeclinedEvent(): MetricQuestionnaireDeclined {
    return {
      ...this.baseEvent(),
      eventName: 'questionnaire.declined',
      payload: this.basePayload(),
    };
  }

  protected buildAbandonedEvent(): MetricQuestionnaireAbandoned {
    return {
      ...this.baseEvent(),
      eventName: 'questionnaire.abandoned',
      payload: this.basePayload(),
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
