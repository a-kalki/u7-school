import * as v from 'valibot';
import { QuestionnaireSchema } from '../entity';
import { MetricQuestionPoolSchema } from './metric-question';

/** Контекст запуска метрик-анкеты */
export const MetricContextSchema = v.picklist([
  'module_completed',
  'pair_programming',
  'code_review',
  'initiative',
]);
export type MetricContext = v.InferOutput<typeof MetricContextSchema>;

/** Роль оценивающего */
export const MetricRoleSchema = v.picklist([
  'student_student',
  'mentor_student',
  'student_mentor',
]);
export type MetricRole = v.InferOutput<typeof MetricRoleSchema>;

/** Что спровоцировало запуск анкеты */
export const MetricTriggerEventSchema = v.object({
  type: v.pipe(v.string(), v.nonEmpty('Тип события не может быть пустым')),
  aggregateId: v.pipe(
    v.string(),
    v.nonEmpty('ID агрегата не может быть пустым'),
  ),
});
export type MetricTriggerEvent = v.InferOutput<typeof MetricTriggerEventSchema>;

/**
 * Оценочный контекст метрик-анкеты: кто кого оценивает и в каком контексте.
 */
export const MetricAssessmentSchema = v.object({
  context: MetricContextSchema,
  role: MetricRoleSchema,
  subjectId: v.pipe(v.string(), v.uuid('subjectId должен быть валидным UUID')),
  triggerEvent: v.optional(MetricTriggerEventSchema),
});
export type MetricAssessment = v.InferOutput<typeof MetricAssessmentSchema>;

/** Состояние метрик-анкеты: упрощённый пул (MetricQuestion[]) + оценочный контекст */
export const MetricQuestionnaireSchema = v.object({
  ...QuestionnaireSchema.entries,
  questionPool: MetricQuestionPoolSchema,
  assessment: MetricAssessmentSchema,
});
export type MetricQuestionnaire = v.InferOutput<
  typeof MetricQuestionnaireSchema
>;
