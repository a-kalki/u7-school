import * as v from 'valibot';
import type { AnswerOption } from '../question';
import { ChoiceQuestionSchema } from '../question';

// ── Связь «категория → допустимые подкатегории» ──

const PROFESSIONAL_SUBCATEGORIES = [
  'work_quality',
  'algorithmic_thinking',
  'tooling',
] as const;

const TEAM_SUBCATEGORIES = [
  'communication',
  'initiative',
  'honesty',
  'mutual_help',
] as const;

const PERSONAL_SUBCATEGORIES = [
  'enthusiasm',
  'responsibility',
  'regularity',
] as const;

/** Категория метрики */
export const MetricCategorySchema = v.picklist([
  'professional_skills',
  'team_skills',
  'personal_skills',
]);
export type MetricCategory = v.InferOutput<typeof MetricCategorySchema>;

/** Подкатегория метрики (все допустимые коды) */
export const MetricSubcategorySchema = v.picklist([
  ...PROFESSIONAL_SUBCATEGORIES,
  ...TEAM_SUBCATEGORIES,
  ...PERSONAL_SUBCATEGORIES,
]);
export type MetricSubcategory = v.InferOutput<typeof MetricSubcategorySchema>;

/**
 * Маппинг вопроса на метрику.
 * Связь категория↔подкатегория гарантирована: подкатегорию одной
 * категории нельзя положить в другую.
 */
export const MetricMappingSchema = v.variant('category', [
  v.object({
    category: v.literal('professional_skills'),
    subcategory: v.picklist(PROFESSIONAL_SUBCATEGORIES),
    weight: v.optional(v.pipe(v.number(), v.minValue(0)), 1.0),
  }),
  v.object({
    category: v.literal('team_skills'),
    subcategory: v.picklist(TEAM_SUBCATEGORIES),
    weight: v.optional(v.pipe(v.number(), v.minValue(0)), 1.0),
  }),
  v.object({
    category: v.literal('personal_skills'),
    subcategory: v.picklist(PERSONAL_SUBCATEGORIES),
    weight: v.optional(v.pipe(v.number(), v.minValue(0)), 1.0),
  }),
]);
export type MetricMapping = v.InferOutput<typeof MetricMappingSchema>;

/**
 * Балл по подкатегории — результат вычисления metricScores.
 * Связь категория↔подкатегория гарантирована тем же способом.
 */
export const MetricScoreSchema = v.variant('category', [
  v.object({
    category: v.literal('professional_skills'),
    subcategory: v.picklist(PROFESSIONAL_SUBCATEGORIES),
    score: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
  }),
  v.object({
    category: v.literal('team_skills'),
    subcategory: v.picklist(TEAM_SUBCATEGORIES),
    score: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
  }),
  v.object({
    category: v.literal('personal_skills'),
    subcategory: v.picklist(PERSONAL_SUBCATEGORIES),
    score: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
  }),
]);
export type MetricScore = v.InferOutput<typeof MetricScoreSchema>;

// ── Шкала Лайкерта ──

/**
 * Стандартная шкала Лайкерта 1–5 (тексты из концепции метрик).
 * Используется при преобразовании MetricQuestion в ChoiceQuestion
 * для движка — это варианты ответа, а не сам ответ пользователя.
 */
export const LIKERT_SCALE: readonly AnswerOption[] = [
  { answerCode: '1', answer: 'Полностью не согласен' },
  { answerCode: '2', answer: 'Скорее не согласен' },
  { answerCode: '3', answer: 'Нейтрально / затрудняюсь ответить' },
  { answerCode: '4', answer: 'Скорее согласен' },
  { answerCode: '5', answer: 'Полностью согласен' },
];

// ── MetricQuestion ──

/**
 * Вопрос метрики — компактный тип.
 * Не хранит type/multiple/answers/condition: метрики всегда choice,
 * одиночный выбор, стандартная шкала Лайкерт 1–5.
 * Перед передачей в движок преобразуется в обычный ChoiceQuestion.
 */
export const MetricQuestionSchema = v.object({
  questionCode: ChoiceQuestionSchema.entries.questionCode,
  question: ChoiceQuestionSchema.entries.question,
  metricMapping: MetricMappingSchema,
});
export type MetricQuestion = v.InferOutput<typeof MetricQuestionSchema>;
