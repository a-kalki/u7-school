import type { QuestionnairePool } from '@u7-scl/questionnaire/domain';
import { QuestionnairePoolSchema } from '@u7-scl/questionnaire/domain';
import * as v from 'valibot';
import coursePools from './course.json';

const CoursePoolsSchema = v.record(v.string(), QuestionnairePoolSchema);

/** Пулы анкет желаний по courseId (валидация при загрузке модуля). */
const pools: Record<string, QuestionnairePool> = v.parse(
  CoursePoolsSchema,
  coursePools,
);

/**
 * Пул анкеты желания курса.
 * Курс без пула фиксирует желание мгновенно (без анкеты).
 */
export function findCoursePool(
  courseId: string,
): QuestionnairePool | undefined {
  return pools[courseId];
}
