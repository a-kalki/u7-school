import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import type { StudentSchema } from '../entity';
import { StreamSchema } from '../../stream/entity';

export const ListStreamStudentsCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
});

export type ListStreamStudentsCmd = v.InferOutput<
  typeof ListStreamStudentsCmdSchema
>;

export interface ListStreamStudentsCmdMeta extends UcMeta {
  ucName: 'list-stream-students';
  input: ListStreamStudentsCmd;
  output: ReturnType<typeof StudentSchema>[];
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'query';
}
