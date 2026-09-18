import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';

export const ListScopeFactsCmdSchema = v.object({
  scopeId: v.pipe(v.string(), v.uuid('Некорректный формат UUID скоупа')),
});

export type ListScopeFactsCmd = v.InferOutput<typeof ListScopeFactsCmdSchema>;

/** Факты отзывов скоупа для фасада (ФР-8): есть ли отзывы и сколько. */
export const ScopeFactsSchema = v.object({
  hasReviews: v.boolean(),
  reviewsCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export type ScopeFacts = v.InferOutput<typeof ScopeFactsSchema>;

export interface ListScopeFactsCmdMeta extends UcMeta {
  ucName: 'list-scope-facts';
  input: ListScopeFactsCmd;
  output: ScopeFacts;
  errors: never;
  requiresAuth: true;
  type: 'query';
}
