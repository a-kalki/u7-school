import * as v from 'valibot';
import type { Question } from './question';
import { QuestionSchema } from './question';

/** Приглашение пройти анкету (статус invited) */
export type InviteResponse = {
  type: 'invited';
  questionnaireId: string;
  inviteText?: string;
  whyText?: string;
  cancelWarning?: string;
};

/** Ожидание выбора (multiple choice, черновики) */
export type WaitNextResponse = {
  type: 'wait_next';
  questionnaireId: string;
  currentQuestion: Question;
  selectedAnswers: string[];
  nextButton?: string;
  cancelWarning?: string;
  /** Позиция текущего вопроса в пуле (1-based) — для шапки «Вопрос N из M». */
  questionIndex?: number;
  /** Общий размер пула — для шапки «Вопрос N из M». */
  poolSize?: number;
};

/** Новый вопрос */
export type NewQuestionResponse = {
  type: 'new_question';
  questionnaireId: string;
  question: Question;
  selectedAnswers?: string[];
  previousQuestion?: Question;
  previousSelectedAnswers?: string[];
  cancelWarning?: string;
  /** Позиция текущего вопроса в пуле (1-based) — для шапки «Вопрос N из M». */
  questionIndex?: number;
  /** Общий размер пула — для шапки «Вопрос N из M». */
  poolSize?: number;
};

/** Анкета завершена */
export type CompletedResponse = {
  type: 'completed';
  questionnaireId: string;
  selectedAnswers?: string[];
  previousQuestion?: Question;
  previousSelectedAnswers?: string[];
  /** Текст завершения из пула анкеты — рендерится вместо fallback-сообщения. */
  completionText?: string;
};

export type QuestionnaireActionResponse =
  | InviteResponse
  | WaitNextResponse
  | NewQuestionResponse
  | CompletedResponse;

// ── Valibot схемы ──

export const InviteResponseSchema = v.object({
  type: v.literal('invited'),
  questionnaireId: v.string(),
  inviteText: v.optional(v.string()),
  whyText: v.optional(v.string()),
  cancelWarning: v.optional(v.string()),
});

export const WaitNextResponseSchema = v.object({
  type: v.literal('wait_next'),
  questionnaireId: v.string(),
  currentQuestion: QuestionSchema,
  selectedAnswers: v.array(v.string()),
  nextButton: v.optional(v.string()),
  cancelWarning: v.optional(v.string()),
  questionIndex: v.optional(v.number()),
  poolSize: v.optional(v.number()),
});

export const NewQuestionResponseSchema = v.object({
  type: v.literal('new_question'),
  questionnaireId: v.string(),
  question: QuestionSchema,
  selectedAnswers: v.optional(v.array(v.string())),
  previousQuestion: v.optional(QuestionSchema),
  previousSelectedAnswers: v.optional(v.array(v.string())),
  cancelWarning: v.optional(v.string()),
  questionIndex: v.optional(v.number()),
  poolSize: v.optional(v.number()),
});

export const CompletedResponseSchema = v.object({
  type: v.literal('completed'),
  questionnaireId: v.string(),
  selectedAnswers: v.optional(v.array(v.string())),
  previousQuestion: v.optional(QuestionSchema),
  previousSelectedAnswers: v.optional(v.array(v.string())),
  completionText: v.optional(v.string()),
});

export const QuestionnaireActionResponseSchema = v.variant('type', [
  InviteResponseSchema,
  WaitNextResponseSchema,
  NewQuestionResponseSchema,
  CompletedResponseSchema,
]);
