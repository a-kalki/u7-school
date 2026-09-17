import * as v from 'valibot';
import {
  PERSONAL_SUBCATEGORIES,
  PROFESSIONAL_SUBCATEGORIES,
  skillCategories,
  TEAM_SUBCATEGORIES,
} from './categories';

/**
 * Балл по подкатегории — результат оценки.
 * Связь категория↔подкатегория гарантирована тем же способом, что и в маппинге.
 */
export const SkillScoreSchema = v.variant('category', [
  v.object({
    category: v.literal(skillCategories[0]),
    subcategory: v.picklist(PROFESSIONAL_SUBCATEGORIES),
    score: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
  }),
  v.object({
    category: v.literal(skillCategories[1]),
    subcategory: v.picklist(TEAM_SUBCATEGORIES),
    score: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
  }),
  v.object({
    category: v.literal(skillCategories[2]),
    subcategory: v.picklist(PERSONAL_SUBCATEGORIES),
    score: v.pipe(v.number(), v.minValue(1), v.maxValue(5)),
  }),
]);
export type SkillScore = v.InferOutput<typeof SkillScoreSchema>;
