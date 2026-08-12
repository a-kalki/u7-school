import * as v from 'valibot';
import { QuestionnairePoolSchema } from './question';

/** Зафиксированный ответ */
export const AnswerSchema = v.object({
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса не может быть пустым'),
  ),
  /** Код(ы) ответа: для choice — "yes" или "yes,no", для text — "text" */
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

/** Схема состояния анкеты */
export const QuestionnaireSchema = v.object({
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
  /** Снимок пула вопросов. null в invited, заполняется при start(). */
  questionPool: v.nullable(QuestionnairePoolSchema),
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

/** Метаданные агрегата Questionnaire */
export interface QuestionnaireArMeta {
  name: 'Questionnaire';
  label: 'Анкета';
  state: Questionnaire;
}
