import * as v from 'valibot';
import type { AnswerOption } from '../question';

// ── Шкала Лайкерта ──

/**
 * Стандартная шкала Лайкерта 1–5.
 * Используется при преобразовании LikertQuestion в ChoiceQuestion
 * для движка — это варианты ответа, а не сам ответ пользователя.
 */
export const LIKERT_SCALE: readonly AnswerOption[] = [
  { answerCode: '1', answer: 'Полностью не согласен' },
  { answerCode: '2', answer: 'Скорее не согласен' },
  { answerCode: '3', answer: 'Нейтрально / затрудняюсь ответить' },
  { answerCode: '4', answer: 'Скорее согласен' },
  { answerCode: '5', answer: 'Полностью согласен' },
];

// ── Узкие (структурные) типы likert-анкеты ──
//
// Модуль questionnaire не знает словарь навыков (категории, подкатегории,
// допустимые веса). Он знает только структуру: category/subcategory — строки,
// weight — число, score — число в диапазоне [1;5]. Полная валидация словаря —
// в модуле peer-review.

/** Маппинг вопроса на метрику (узкий: категория↔подкатегория не связаны). */
export const LikertMappingSchema = v.object({
  category: v.pipe(v.string(), v.nonEmpty('Категория не может быть пустой')),
  subcategory: v.pipe(
    v.string(),
    v.nonEmpty('Подкатегория не может быть пустой'),
  ),
  weight: v.number(),
});
export type LikertMapping = v.InferOutput<typeof LikertMappingSchema>;

/** Балл по подкатегории — результат вычисления likertScores. */
export const LikertScoreSchema = v.object({
  category: v.pipe(v.string(), v.nonEmpty('Категория не может быть пустой')),
  subcategory: v.pipe(
    v.string(),
    v.nonEmpty('Подкатегория не может быть пустой'),
  ),
  score: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
});
export type LikertScore = v.InferOutput<typeof LikertScoreSchema>;

/**
 * Вопрос likert-анкеты — компактный тип.
 * Не хранит type/multiple/answers/condition: likert всегда choice,
 * одиночный выбор, стандартная шкала Лайкерта 1–5.
 */
export const LikertQuestionSchema = v.object({
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса не может быть пустым'),
  ),
  question: v.pipe(
    v.string(),
    v.nonEmpty('Текст вопроса не может быть пустым'),
  ),
  likertMapping: LikertMappingSchema,
});
export type LikertQuestion = v.InferOutput<typeof LikertQuestionSchema>;

/** Пул вопросов likert-анкеты — метаданные + LikertQuestion[] */
export const LikertQuestionPoolSchema = v.object({
  inviteText: v.optional(v.string()),
  whyText: v.optional(v.string()),
  completionText: v.optional(v.string()),
  cancelWarning: v.optional(v.string()),
  questions: v.pipe(
    v.array(LikertQuestionSchema),
    v.minLength(1, 'Пул должен содержать хотя бы один вопрос'),
  ),
});
export type LikertQuestionPool = v.InferOutput<typeof LikertQuestionPoolSchema>;
