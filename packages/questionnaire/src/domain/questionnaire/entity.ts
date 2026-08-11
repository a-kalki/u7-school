import * as v from 'valibot';

/** Зафиксированный ответ с полным контекстом */
export const AnswerSchema = v.object({
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса не может быть пустым'),
  ),
  questionText: v.pipe(
    v.string(),
    v.nonEmpty('Текст вопроса не может быть пустым'),
  ),
  answerCode: v.pipe(v.string(), v.nonEmpty('Код ответа не может быть пустым')),
  answerText: v.pipe(
    v.string(),
    v.nonEmpty('Текст ответа не может быть пустым'),
  ),
  choices: v.pipe(
    v.array(
      v.object({
        code: v.pipe(
          v.string(),
          v.nonEmpty('Код варианта не может быть пустым'),
        ),
        text: v.pipe(
          v.string(),
          v.nonEmpty('Текст варианта не может быть пустым'),
        ),
      }),
    ),
    v.minLength(0),
  ),
  answeredAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты ответа'),
  ),
});

export type Answer = v.InferOutput<typeof AnswerSchema>;

/** Статус анкеты */
export const QuestionnaireStatusSchema = v.picklist(
  ['intention', 'in_progress', 'completed', 'abandoned'],
  'Некорректный статус анкеты',
);

export type QuestionnaireStatus = v.InferOutput<
  typeof QuestionnaireStatusSchema
>;

/** Схема состояния анкеты */
export const QuestionnaireSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  respondentId: v.pipe(
    v.number(),
    v.minValue(1, 'respondentId должен быть положительным числом'),
  ),
  status: QuestionnaireStatusSchema,
  currentQuestionCode: v.nullable(
    v.pipe(v.string(), v.nonEmpty('Код текущего вопроса не может быть пустым')),
  ),
  draftAnswers: v.record(v.string(), v.string()),
  answers: v.array(AnswerSchema),
  questionPool: v.nullable(
    v.pipe(
      v.array(v.any()),
      v.minLength(1, 'Пул вопросов не может быть пустым'),
    ),
  ),
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
