import * as v from 'valibot';

/** Подкатегории категории professional_skills. */
export const PROFESSIONAL_SUBCATEGORIES = [
  'work_quality',
  'algorithmic_thinking',
  'tooling',
] as const;

/** Подкатегории категории team_skills. */
export const TEAM_SUBCATEGORIES = [
  'communication',
  'initiative',
  'honesty',
  'mutual_help',
] as const;

/** Подкатегории категории personal_skills. */
export const PERSONAL_SUBCATEGORIES = [
  'enthusiasm',
  'responsibility',
  'regularity',
] as const;

/** Категории навыка как значения. */
export const skillCategories = [
  'professional_skills',
  'team_skills',
  'personal_skills',
] as const;

/** Категория навыка. */
export const SkillCategorySchema = v.picklist([...skillCategories]);
export type SkillCategory = v.InferOutput<typeof SkillCategorySchema>;

/** Подкатегория навыка (все допустимые коды). */
export const SkillSubcategorySchema = v.picklist([
  ...PROFESSIONAL_SUBCATEGORIES,
  ...TEAM_SUBCATEGORIES,
  ...PERSONAL_SUBCATEGORIES,
]);
export type SkillSubcategory = v.InferOutput<typeof SkillSubcategorySchema>;

/** Допустимые веса вопроса (единственное место определения). */
export const SkillWeightSchema = v.union([
  v.literal(0.75),
  v.literal(1),
  v.literal(1.25),
]);
export type SkillWeight = v.InferOutput<typeof SkillWeightSchema>;

/**
 * Маппинг вопроса на навык.
 * Связь категория↔подкатегория гарантирована: подкатегорию одной
 * категории нельзя положить в другую.
 */
export const SkillMappingSchema = v.variant('category', [
  v.object({
    category: v.literal('professional_skills'),
    subcategory: v.picklist(PROFESSIONAL_SUBCATEGORIES),
    weight: SkillWeightSchema,
  }),
  v.object({
    category: v.literal('team_skills'),
    subcategory: v.picklist(TEAM_SUBCATEGORIES),
    weight: SkillWeightSchema,
  }),
  v.object({
    category: v.literal('personal_skills'),
    subcategory: v.picklist(PERSONAL_SUBCATEGORIES),
    weight: SkillWeightSchema,
  }),
]);
export type SkillMapping = v.InferOutput<typeof SkillMappingSchema>;
