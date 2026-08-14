import type { ArMeta } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { QuestionnairePoolSchema } from './question';

/** Зафиксированный ответ */
export const AnswerSchema = v.object({
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса не может быть пустым'),
  ),
  /** Код(ы) ответа: для choice — <code>, для text — "text" */
  answerCode: v.pipe(v.string(), v.nonEmpty('Код ответа не может быть пустым')),
  /** Текст ответа: обязателен для text-вопросов, отсутствует для choice */
  answerText: v.optional(v.string()),
  answeredAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты ответа'),
  ),
});

export type Answer = v.InferOutput<typeof AnswerSchema>;

/** Статус анкеты */
export const QuestionnaireStatusSchema = v.picklist(
  ['invited', 'in_progress', 'completed', 'abandoned'],
  'Некорректный статус анкеты',
);

export type QuestionnaireStatus = v.InferOutput<
  typeof QuestionnaireStatusSchema
>;

/** Схема состояния обычной анкеты */
export const QuestionnaireSchema = v.object({
  kind: v.literal('standard'),
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  respondentId: v.pipe(
    v.string(),
    v.uuid('respondentId должен быть валидным UUID'),
  ),
  status: QuestionnaireStatusSchema,
  currentQuestionCode: v.nullable(
    v.pipe(v.string(), v.nonEmpty('Код текущего вопроса не может быть пустым')),
  ),
  draftAnswers: v.record(v.string(), v.string()),
  answers: v.array(AnswerSchema),
  questionPool: QuestionnairePoolSchema,
  createdAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты создания'),
  ),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты обновления')),
  ),
  completedAt: v.nullable(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты завершения')),
  ),
});

export type Questionnaire = v.InferOutput<typeof QuestionnaireSchema>;

/**
 * Базовые поля состояния анкеты — общие для базового QuestionnaireAr
 * и наследников (например, MetricQuestionnaireAr с упрощённым пулом).
 */
export type BaseQuestionnaireState = {
  kind: 'standard' | 'metric';
  uuid: string;
  respondentId: string;
  status: QuestionnaireStatus;
  currentQuestionCode: string | null;
  draftAnswers: Record<string, string>;
  answers: Answer[];
  questionPool: {
    inviteText?: string;
    whyText?: string;
    completionText?: string;
    cancelWarning?: string;
    questions: unknown[];
  };
  createdAt: string;
  updatedAt?: string;
  completedAt: string | null;
};

/** Метаданные агрегата Questionnaire */
export interface BaseQuestionnaireArMeta extends ArMeta {
  name: 'Questionnaire';
  label: 'Анкета';
  state: BaseQuestionnaireState;
}
