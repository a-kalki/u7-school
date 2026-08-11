import * as v from 'valibot';
import type { Question } from './question';

/** Зафиксированный ответ */
export const AnswerSchema = v.object({
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса не может быть пустым'),
  ),
  /** Код(ы) ответа: для choice — "yes" или "yes,no", для text — "text" */
  answerCode: v.pipe(v.string(), v.nonEmpty('Код ответа не может быть пустым')),
  /** Текст ответа: для text — введённый текст, для choice — пустая строка */
  answerText: v.string(),
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
  /** Снимок пула вопросов. null в intention, заполняется при start(). */
  questionPool: v.nullable(v.array(v.any())),
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

// ── Вспомогательные функции ──

/** Извлекает Question по коду из снимка пула */
export function findQuestionInPool(
  pool: Question[],
  code: string,
): Question | undefined {
  return pool.find((q) => q.questionCode === code);
}

/** Получить текст вопроса из пула */
export function getQuestionText(pool: Question[], code: string): string {
  return findQuestionInPool(pool, code)?.question ?? code;
}

/** Получить текст ответа для choice-вопроса */
export function getAnswerText(
  pool: Question[],
  questionCode: string,
  answerCode: string,
): string {
  const q = findQuestionInPool(pool, questionCode);
  if (!q || q.type !== 'choice') return '';
  // answerCode может быть составным: "yes,no"
  const codes = answerCode.split(',').filter(Boolean);
  return codes
    .map((c) => q.answers.find((a) => a.answerCode === c)?.answer ?? c)
    .join(', ');
}

/** Получить все варианты ответа для choice-вопроса */
export function getChoices(
  pool: Question[],
  questionCode: string,
): { code: string; text: string }[] {
  const q = findQuestionInPool(pool, questionCode);
  if (!q || q.type !== 'choice') return [];
  return q.answers.map((a) => ({ code: a.answerCode, text: a.answer }));
}
