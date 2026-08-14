import * as v from 'valibot';
import { QuestionnaireSchema } from '../entity';
import { LikertQuestionPoolSchema } from './likert-question';

/** Зафиксированный ответ likert-анкеты (всегда choice, без answerText). */
export const LikertAnswerSchema = v.object({
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса не может быть пустым'),
  ),
  answerCode: v.pipe(v.string(), v.nonEmpty('Код ответа не может быть пустым')),
  answeredAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты ответа'),
  ),
});

export type LikertAnswer = v.InferOutput<typeof LikertAnswerSchema>;

/** Состояние likert-анкеты: узкий пул (LikertQuestion[]) без assessment. */
export const LikertQuestionnaireSchema = v.object({
  ...QuestionnaireSchema.entries,
  kind: v.literal('likert'),
  questionPool: LikertQuestionPoolSchema,
  answers: v.array(LikertAnswerSchema),
});

export type LikertQuestionnaire = v.InferOutput<
  typeof LikertQuestionnaireSchema
>;
