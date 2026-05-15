import * as v from 'valibot';

/** Запись об ответе на вопрос */
export const AnswerEntrySchema = v.object({
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса в ответе не может быть пустым'),
  ),
  answerCodes: v.array(
    v.pipe(v.string(), v.nonEmpty('Код ответа не может быть пустым')),
  ),
  textValue: v.optional(
    v.pipe(v.string(), v.nonEmpty('Текстовый ответ не может быть пустым')),
  ),
  answeredAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты ответа'),
  ),
});

export type AnswerEntry = v.InferOutput<typeof AnswerEntrySchema>;

/** Статус прохождения анкеты */
export const QuestionnaireStatusSchema = v.picklist(
  ['in_progress', 'completed', 'abandoned'],
  'Некорректный статус анкеты',
);

export type QuestionnaireStatus = v.InferOutput<
  typeof QuestionnaireStatusSchema
>;

/** Схема состояния анкеты */
export const QuestionnaireSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  userId: v.pipe(v.string(), v.nonEmpty('userId не может быть пустым')),
  status: QuestionnaireStatusSchema,
  answers: v.array(AnswerEntrySchema),
  currentQuestionCode: v.nullable(
    v.pipe(v.string(), v.nonEmpty('Код текущего вопроса не может быть пустым')),
  ),
  createdAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты начала'),
  ),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты обновления')),
  ),
  completedAt: v.optional(
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
