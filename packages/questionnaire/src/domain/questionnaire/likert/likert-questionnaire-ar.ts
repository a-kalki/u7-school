import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import { BaseQuestionnaireAr } from '../a-root';
import type { BaseQuestionnaireArMeta } from '../entity';
import type {
  LikertQuestionnaireAbandonEvent,
  LikertQuestionnaireCompleteEvent,
  LikertQuestionnaireDeclineEvent,
} from '../events';
import type { ChoiceQuestion } from '../question';
import { QuestionnaireEngine } from '../questionnaire-engine';
import {
  LIKERT_SCALE,
  type LikertMapping,
  type LikertQuestion,
  type LikertScore,
  LikertScoreSchema,
} from './likert-question';
import {
  type LikertQuestionnaire,
  LikertQuestionnaireSchema,
} from './likert-questionnaire';

export interface LikertQuestionnaireArMeta extends BaseQuestionnaireArMeta {
  state: LikertQuestionnaire;
  events:
    | LikertQuestionnaireCompleteEvent
    | LikertQuestionnaireDeclineEvent
    | LikertQuestionnaireAbandonEvent;
}

/** Агрегат likert-анкеты: публикует события завершения/отказа/прерывания. */
export class LikertQuestionnaireAr extends BaseQuestionnaireAr<LikertQuestionnaireArMeta> {
  constructor(state: LikertQuestionnaire) {
    super(state, LikertQuestionnaireSchema);
  }

  protected override buildEngine(
    state: LikertQuestionnaire,
  ): QuestionnaireEngine {
    return new QuestionnaireEngine(
      state.questionPool.questions.map((q) => this.toChoiceQuestion(q)),
    );
  }

  /** Преобразует компактный LikertQuestion в полный ChoiceQuestion для движка. */
  private toChoiceQuestion(lq: LikertQuestion): ChoiceQuestion {
    return {
      questionCode: lq.questionCode,
      question: lq.question,
      type: 'choice',
      multiple: false,
      answers: [...LIKERT_SCALE],
    };
  }

  /** Общие поля события. */
  private baseEvent() {
    return {
      eventId: crypto.randomUUID(),
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire' as const,
      aggregateId: this.state.uuid,
    };
  }

  /** Общие поля payload событий likert-анкеты (без likertScores). */
  private basePayload() {
    return {
      questionnaireId: this.state.uuid,
      respondentId: this.state.respondentId,
    };
  }

  protected buildCompletedEvent(): LikertQuestionnaireCompleteEvent {
    return {
      ...this.baseEvent(),
      eventName: 'questionnaire:likert-complete',
      ownerInfo: this.state.ownerInfo,
      payload: {
        ...this.basePayload(),
        likertScores: this.computeLikertScores(),
      },
    };
  }

  protected buildDeclinedEvent(): LikertQuestionnaireDeclineEvent {
    return {
      ...this.baseEvent(),
      eventName: 'questionnaire:likert-decline',
      ownerInfo: this.state.ownerInfo,
      payload: this.basePayload(),
    };
  }

  protected buildAbandonedEvent(): LikertQuestionnaireAbandonEvent {
    return {
      ...this.baseEvent(),
      eventName: 'questionnaire:likert-abandon',
      ownerInfo: this.state.ownerInfo,
      payload: this.basePayload(),
    };
  }

  /**
   * Вычисляет баллы по подкатегориям как средневзвешенное:
   * Σ(answer × weight) / Σ(weight).
   *
   * Выход валидируется здесь, схемой LikertScoreSchema: агрегат знает
   * структуру выхода (category/subcategory/score ∈ [1;5]).
   */
  private computeLikertScores(): LikertScore[] {
    type Acc = {
      category: LikertMapping['category'];
      subcategory: LikertMapping['subcategory'];
      weightedSum: number;
      weightSum: number;
    };

    const byCode = new Map<string, LikertMapping>();
    for (const question of this.state.questionPool.questions) {
      byCode.set(question.questionCode, question.likertMapping);
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
      category: LikertMapping['category'];
      subcategory: LikertMapping['subcategory'];
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

    return v.parse(v.array(LikertScoreSchema), raw);
  }
}
