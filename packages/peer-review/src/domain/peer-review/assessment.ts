import * as v from 'valibot';

/** Контекст запуска оценки. */
export const PeerReviewContextSchema = v.picklist([
  'module_completed',
  'pair_programming',
  'code_review',
  'initiative',
]);
export type PeerReviewContext = v.InferOutput<typeof PeerReviewContextSchema>;

/** Роль оценивающего. */
export const PeerReviewRoleSchema = v.picklist([
  'student_student',
  'mentor_student',
  'student_mentor',
]);
export type PeerReviewRole = v.InferOutput<typeof PeerReviewRoleSchema>;

/** Что спровоцировало запуск оценки. */
export const PeerReviewTriggerEventSchema = v.object({
  type: v.pipe(v.string(), v.nonEmpty('Тип события не может быть пустым')),
  aggregateId: v.pipe(
    v.string(),
    v.nonEmpty('ID агрегата не может быть пустым'),
  ),
});
export type PeerReviewTriggerEvent = v.InferOutput<
  typeof PeerReviewTriggerEventSchema
>;

/**
 * Оценочный контекст: кто кого оценивает и в каком контексте.
 */
export const PeerReviewAssessmentSchema = v.object({
  context: PeerReviewContextSchema,
  role: PeerReviewRoleSchema,
  subjectId: v.pipe(v.string(), v.uuid('subjectId должен быть валидным UUID')),
  triggerEvent: v.optional(PeerReviewTriggerEventSchema),
});
export type PeerReviewAssessment = v.InferOutput<
  typeof PeerReviewAssessmentSchema
>;
