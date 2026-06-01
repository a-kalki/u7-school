import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import type { StreamSchema } from '../entity';
import { StreamStatusSchema } from '../status';

/** Схема фильтрации потоков */
export const ListStreamsCmdSchema = v.object({
  status: v.optional(StreamStatusSchema),
  mentorId: v.optional(v.string()),
});

export type ListStreamsCmd = v.InferOutput<typeof ListStreamsCmdSchema>;

export interface ListStreamsCmdMeta extends UcMeta {
  ucName: 'list-streams';
  input: ListStreamsCmd;
  output: v.InferOutput<typeof StreamSchema>[];
  errors: StreamUcErrors;
  requiresAuth: false;
  type: 'query';
}
