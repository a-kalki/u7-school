import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import type { StreamArMeta } from '../entity';
import { StreamSchema } from '../entity';
import { StudentSchema } from '../../student/entity';

export const CompleteStreamCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  studentOutcomes: v.array(
    v.object({
      studentId: StudentSchema.entries.uuid,
      outcome: v.union([
        v.literal('advanced'),
        v.literal('not_advanced'),
        v.literal('abandoned'),
      ]),
    }),
  ),
});

export type CompleteStreamCmd = v.InferOutput<typeof CompleteStreamCmdSchema>;

export interface CompleteStreamCmdMeta extends UcMeta {
  ucName: 'complete-stream';
  arMeta: StreamArMeta;
  input: CompleteStreamCmd;
  output: undefined;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
