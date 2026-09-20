import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import { StudentStatusSchema } from '../../status';
import { StreamSchema } from '../../stream/entity';
import type { StudentSchema } from '../../student/entity';

export const ListStreamStudentsCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  status: v.optional(StudentStatusSchema),
});

export type ListStreamStudentsCmd = v.InferOutput<
  typeof ListStreamStudentsCmdSchema
>;

export interface ListStreamStudentsCmdMeta extends UcMeta {
  ucName: 'list-stream-students';
  input: ListStreamStudentsCmd;
  output: v.InferOutput<typeof StudentSchema>[];
  errors: StreamUcErrors;
  /** Публичный read-API: фасад getMembers зовёт без актора из ER peer-review. */
  requiresAuth: false;
  type: 'query';
}
